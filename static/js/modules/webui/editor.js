/*
 * Control and layout of file editing.
 */

import * as Common from './common.js'
import * as Render from './render.js'
import * as Log from './log.js'
import * as Util from './util.js'

import * as QuizGen from '/js/modules/quizgen/base.js'

const OUTPUT_QUESTION_FORMATS = [
    'html',
    'canvas',
    'json',
    'tex',
];

const OUTPUT_QUIZ_FORMATS = OUTPUT_QUESTION_FORMATS.concat([
    'pdf',
]);

const OUTPUT_EMPTY_OPTION = ['-', ''];

const OUTPUT_OPTIONS = {
    'quiz': [OUTPUT_EMPTY_OPTION].concat(OUTPUT_QUIZ_FORMATS.map((format) => [format, format])),
    'question': [OUTPUT_EMPTY_OPTION].concat(OUTPUT_QUESTION_FORMATS.map((format) => [format, format])),
};

let _layout = undefined;
let _selectedRelpath = undefined;

// {relpath: layout component (tab), ...}.
let _activeTabs = {};

// {compile target (relpath): {format: relpath, ...}, ...}.
let _activeOutputTabs = {};

// {relpath: dirent info, ...}.
let _projectFiles = {};

let _emptyFormatOptions = `<option value='${OUTPUT_EMPTY_OPTION[1]}'>${OUTPUT_EMPTY_OPTION[0]}</option>`;

function init() {
    initControls()
    initLayout()
}

function initControls() {
    let container = document.querySelector('.editor-controls');
    container.innerHTML = `
        <button class='editor-control editor-control-save-compile' disabled>Save & Compile</button>
        <select class='editor-control editor-control-format' disabled>${_emptyFormatOptions}</select>
        <span class='editor-control editor-control-active-file'></span>
    `;

    // Register handlers.

    container.querySelector('.editor-control-save-compile').addEventListener('click', function(event) {
        let format = container.querySelector('.editor-control-format').value;
        saveAndCompile(format);
    });
}

function initLayout() {
    let emptyConfig = {
        settings: {
            showPopoutIcon: false,
            showMaximiseIcon: false,
            showCloseIcon: false,
        },
        content: [
            {
                type: 'row',
                content:[],
            }
        ]
    };

    let editorContainer = document.querySelector('.editor');

    _layout = new GoldenLayout(emptyConfig, editorContainer);
    _layout.registerComponent('editor-tab', createTab);
    _layout.registerComponent('output-tab', createOutputTab);

    // Explicitly handle resizes, so ACE can have explicit dimensions.
    const observer = new ResizeObserver(function(entries) {
        let height = entries[0].contentRect.height;
        let width = entries[0].contentRect.width;
        _layout.updateSize(width, height);
    });
    observer.observe(editorContainer);

    _layout.init();
}

function setProject(projectInfo, tree) {
    _projectFiles = {};

    let walk = function(node) {
        if (node.type === 'file') {
            _projectFiles[node.relpath] = node;
            return;
        }

        for (const dirent of node.dirents) {
            walk(dirent);
        }
    };

    walk(tree);
}

function saveAndCompile(format) {
    let relpath = _selectedRelpath;
    if (!relpath) {
        return;
    }

    let fileInfo = _projectFiles[relpath];
    if (!fileInfo) {
        Log.warn(`Could not find project file info for '${relpath}'.`);
        return;
    }

    let compileTarget = fileInfo.compileTarget;
    if (!compileTarget) {
        Log.warn(`File '${relpath}' does not have a compile target.`);
        return;
    }

    let savePromise = _save(relpath);

    // Collect all open formats for this compile target in addition to the specified format.
    let formats = new Set();
    if (format != '') {
        formats.add(format);
    }

    for (const openFormat in _activeOutputTabs[compileTarget]) {
        formats.add(openFormat);
    }

    Common.loadingStart('.editor-area');

    // Save then compile all open formats.
    savePromise
        .then(function(saveResult) {
            if (formats.size == 0) {
                return;
            }

            return QuizGen.Project.compile(compileTarget, Array.from(formats))
                .then(function(result) {
                    for (const [format, data] of Object.entries(result)) {
                        let outputRelpath = `${compileTarget}::${format}`;

                        _projectFiles[outputRelpath] = {
                            relpath: outputRelpath,
                            output: true,
                            format: format,
                            editable: false,
                            compileTarget: compileTarget,
                        };

                        openOutput(outputRelpath, compileTarget, data.filename, data.mime, data.content, format);
                    }
                })
            ;
        })
        .catch(function(result) {
            Log.error(result);
        })
        .finally(function() {
            Common.loadingStop('.editor-area');
        })
    ;
}

// Check if this active file has an editor.
// If it does, then we will need to save first.
// If it does not, then we will just resolve the save immediately and move to compiling.
function _save(relpath) {
    let element = document.querySelector(`.code-editor[data-relpath='${relpath}']`);
    if (!element) {
        return Promise.resolve(undefined);
    }

    let text = element.qgg.editor.getValue();
    let contentB64 = Util.textTob64String(text);

    return QuizGen.Project.saveFile(relpath, contentB64);
}

function createOutputTab(component, params) {
    createTab(component, params);

    let fileInfo = _projectFiles[params.relpath];
    _activeOutputTabs[fileInfo.compileTarget] = _activeOutputTabs[fileInfo.compileTarget] ?? {};
    _activeOutputTabs[fileInfo.compileTarget][fileInfo.format] = params.relpath;

    // Keep track of when the tab is closed.
    component.on('destroy', function() {
        delete _activeOutputTabs[fileInfo.compileTarget][fileInfo.format];
    });
}

function createTab(component, params) {
    let fileInfo = _projectFiles[params.relpath];
    if (!fileInfo) {
        throw new Error(`Unable to find file info for new tab '${params.relpath}'.`);
        return;
    }

    let container = component.getElement()[0];
    let editable = Render.file(container, params.relpath, params.filename, params.mime, params.contentB64, params.readonly, selectTab);

    fileInfo.editable = editable;

    // Set this tab active when the header is clicked.
    component.on('tab', function(tab) {
        tab.element[0].addEventListener('click', function(event) {
            selectTab(params.relpath);
        });
    });

    _activeTabs[params.relpath] = component;

    // Keep track of when the tab is closed.
    component.on('destroy', function() {
        editorTabClosed(params.relpath);
    });

    selectTab(params.relpath);
}

function editorTabClosed(relpath) {
    delete _activeTabs[relpath];

    if (relpath == _selectedRelpath) {
        clearSelectedTab();
    }
}

function clearSelectedTab() {
    _selectedRelpath = undefined;

    let controlLabel = document.querySelector('.editor-controls .selected-relpath');
    if (controlLabel) {
        controlLabel.remove();
    }

    let controls = document.querySelectorAll('.editor-controls .editor-control');
    for (const control of controls) {
        control.setAttribute('disabled', '');
    }
    document.querySelector('.editor-controls .editor-control-format').innerHTML = _emptyFormatOptions;
    document.querySelector('.editor-controls .editor-control-active-file').innerHTML = '';
}

function selectTab(relpath) {
    if (relpath === undefined) {
        return;
    }

    if (_selectedRelpath === relpath) {
        return;
    }

    clearSelectedTab();
    _selectedRelpath = relpath;

    // Check if this file is already open for editing,
    // and switch to it if possible.
    // Note the second part of the guard is to see if this tab is being opened right now.
    let tab = _activeTabs[relpath];
    if (tab && tab.tab) {
        tab.parent.parent.setActiveContentItem(tab.parent);
    }

    // Get the information for this file.
    let fileInfo = _projectFiles[relpath];
    if (!fileInfo) {
        Log.warn(`Unable to find file info for selected tab '${relpath}'.`);
        return;
    }

    // If this file is readonly, we are done.
    if (!fileInfo.editable) {
        return;
    }

    // Enable relevant controls.

    let compileTarget = fileInfo.compileTarget;
    let compileObjectType = _projectFiles[compileTarget]?.objectType;

    // All editable files can be saved.
    document.querySelector('.editor-controls .editor-control-save-compile').removeAttribute('disabled');

    // If the file can be compiled, then enable the compilable formats.
    let outputOptions = [OUTPUT_EMPTY_OPTION];
    if (compileObjectType in OUTPUT_OPTIONS) {
        outputOptions = OUTPUT_OPTIONS[compileObjectType];
    }

    let lines = []
    for (const [label, value] of outputOptions) {
        lines.push(`<option value='${value}'>${label}</option>`);
    }
    document.querySelector('.editor-controls .editor-control-format').innerHTML = lines.join("\n");
    document.querySelector('.editor-controls .editor-control-format').removeAttribute('disabled');

    // Get the proper label for the compile target (quiz, question, etc).
    if (compileTarget) {
        let typeLabel = _projectFiles[compileTarget]?.object_type ?? 'file';
        document.querySelector('.editor-controls .editor-control-active-file').innerHTML = `
            <span class='seletced-label'>Active ${typeLabel}: </span>
            <span class='selected-compile-target'>${compileTarget}</span>
        `;
    }
}

// Check if the editor thinks a file should be allowed to load/fetched from the server.
// If we see this file as open, we will not want to load it again.
function hasOpenTab(relpath) {
    return (relpath in _activeTabs);
}

function openOutput(relpath, compileTarget, filename, mime, contentB64, format) {
    open(relpath, filename, mime, contentB64, true, 'output');
}

function openEditor(relpath, filename, mime, contentB64, readonly) {
    // If there is already a tab open, switch to it.
    if (hasOpenTab(relpath)) {
        selectTab(relpath);
        return;
    }

    open(relpath, filename, mime, contentB64, readonly, 'editor');
}

function open(relpath, filename, mime, contentB64, readonly, type) {
    let itemConfig = {
        type: 'component',
        componentName: `${type}-tab`,
        title: filename,
        id: relpath,
        componentState: {
            relpath: relpath,
            filename: filename,
            mime: mime,
            readonly: readonly,
            contentB64: contentB64,
        }
    };

    let existingItem = _layout.root.getItemsById(relpath)[0];

    // If al item already exists, replace it.
    // Otherwise, add to root or the first element.
    if (existingItem) {
        existingItem.parent.replaceChild(existingItem, itemConfig);
    } else if (_layout.root.contentItems.length === 0) {
        _layout.root.addChild(itemConfig);
    } else {
        _layout.root.contentItems[0].addChild(itemConfig);
    }
}

export {
    init,
    openEditor,
    hasOpenTab,
    selectTab,
    setProject,
}
