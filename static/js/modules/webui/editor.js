/*
 * Control and layout of file editing.
 */

import * as Render from './render.js'
import * as Log from './log.js'

const OUTPUT_FORMATS = [
    'html (raw)',
    'html',
    'tex',
    'pdf',
    'json',
]

const PURPOSE_INPUT = 'input';

let _layout = undefined;
let _selectedRelpath = undefined;

// {relpath: {purpose: layout component (tab), ...}, ...}.
let _activeFiles = {};

// {relpath: dirent info, ...}.
let _projectFiles = {};

let _emptyFormatOptions = '<option>*format*</option>';

function init() {
    initControls()
    initLayout()
}

function initControls() {
    let container = document.querySelector('.editor-controls');
    container.innerHTML = `
        <button class='editor-control editor-control-save' disabled>Save</button>
        <button class='editor-control editor-control-compile' disabled>Compile</button>
        <select class='editor-control editor-control-format' disabled>${_emptyFormatOptions}</select>
        <span class='editor-control editor-control-active-file'></span>
    `;

    // Register handlers.

    container.querySelector('.editor-control-save').addEventListener('click', function(event) {
        save();
    });

    container.querySelector('.editor-control-compile').addEventListener('click', function(event) {
        let format = container.querySelector('.editor-control-format').value;
        compile(format);
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
    _layout.registerComponent('editor-tab', createEditorTab);

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

function save() {
    // TEST
    console.log("TEST - SAVE: ", _selectedRelpath);

    // TEST
    // _selectedRelpath
}

function compile(format) {
    // TEST
    console.log("TEST - compile ", format, " : ", _selectedRelpath);

    // TEST
    // _selectedRelpath
}

function createEditorTab(component, params) {
    let fileInfo = _projectFiles[params.relpath];
    if (!fileInfo) {
        throw new Error(`Unable to find file info for new tab '${params.relpath}'.`);
        return;
    }

    if (_activeFiles[params.relpath]?.[params.purpose]) {
        throw new Error(`Cannot create new editor tab, a '${params.purpose}' tab already exists for '${params.relpath}'.`);
    }

    let container = component.getElement()[0];
    let editable = Render.file(container, params.relpath, params.filename, params.mime, params.contentB64, params.readonly, selectTab);

    fileInfo.editable = editable;

    // Keep track of when the tab is closed.
    component.on('destroy', function() {
        tabClosed(params.relpath, params.purpose);
    });

    // Set this tab active when the header is clicked.
    component.on('tab', function(tab) {
        tab.element[0].addEventListener('click', function(event) {
            selectTab(params.relpath);
        });
    });

    _activeFiles[params.relpath] = _activeFiles[params.relpath] ?? {};
    _activeFiles[params.relpath][params.purpose] = component;
    selectTab(params.relpath);
}

function tabClosed(relpath, purpose) {
    delete _activeFiles[relpath][purpose]

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
    document.querySelector('.editor-controls .editor-control-active-file').innerHTML = `
        <span>Active File: </span>
        <span class='selected-relpath'>${relpath}</span>
    `;

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

    let controls = document.querySelectorAll('.editor-controls .editor-control');
    for (const control of controls) {
        control.removeAttribute('disabled');
    }

    let outputOptions = [];
    for (const format of OUTPUT_FORMATS) {
        outputOptions.push(`<option value='${format}'>${format}</option>`);
    }
    document.querySelector('.editor-controls .editor-control-format').innerHTML = outputOptions.join("\n");
}

// Check if the editor thinks a file should be allowed to load/fetched from the server.
// If we see this file as open, we will not want to load it again.
function shouldLoadFile(relpath) {
    return (_activeFiles[relpath]?.[PURPOSE_INPUT] === undefined);
}

function open(relpath, filename, mime, contentB64, purpose, readonly) {
    let id = `${relpath}::${purpose}`;

    // Check if this file is already open for editing,
    // and switch to it if possible.
    let tab = _activeFiles[relpath]?.[purpose];
    if (tab !== undefined) {
        tab.parent.parent.setActiveContentItem(tab.parent);
        selectTab(relpath);
        return;
    }

    let newItem = {
        type: 'component',
        componentName: 'editor-tab',
        title: filename,
        id: id,
        componentState: {
            relpath: relpath,
            filename: filename,
            mime: mime,
            readonly: readonly,
            contentB64: contentB64,
            purpose: purpose,
        }
    };

    // Add to root or the first element.
    if (_layout.root.contentItems.length === 0) {
        _layout.root.addChild(newItem);
    } else {
        _layout.root.contentItems[0].addChild(newItem);
    }
}

export {
    init,
    open,
    shouldLoadFile,
    selectTab,
    setProject,

    PURPOSE_INPUT,
}
