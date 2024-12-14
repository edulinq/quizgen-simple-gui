/*
 * Control and layout of file editing.
 */

import * as Render from './render.js'

// TEST
const OUTPUT_FORMATS = [
    'html (raw)',
    'html',
    'tex',
    'pdf',
    'json',
]

let _layout = undefined;
let _activeFiles = {};
let _selected_relpath = undefined;

function init() {
    initControls()
    initLayout()
}

function initControls() {
    let outputOptions = [];
    for (const format of OUTPUT_FORMATS) {
        outputOptions.push(`<option value='${format}'>${format}</option>`);
    }

    let container = document.querySelector('.editor-controls');
    container.innerHTML = `
        <button class='save' disabled>Save</button>
        <button class='compile' disabled>Compile As →</button>
        <select class='format'>
            ${outputOptions.join("\n")}
        </select>
    `;

    // Register handlers.

    container.querySelector('.save').addEventListener('click', function(event) {
        save();
    });

    container.querySelector('.compile').addEventListener('click', function(event) {
        let format = container.querySelector('.format').value;
        compile(format);
    });
}

function save() {
    // TEST
    console.log("TEST - SAVE");

    // TEST
    // _selected_relpath
}

function compile(format) {
    // TEST
    console.log("TEST - compile ", format);

    // TEST
    // _selected_relpath
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

function createEditorTab(component, params) {
    if (_activeFiles[params.relpath]?.[params.purpose]) {
        throw new Error(`Cannot create new editor tab, a '${params.purpose}' tab already exists for '${params.relpath}'.`);
    }

    let container = component.getElement()[0];
    Render.file(container, params.relpath, params.filename, params.mime, params.contentB64, params.readonly, selectTab);

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

    if (relpath == _selected_relpath) {
        clearSelectedTab();
    }
}

function clearSelectedTab() {
    _selected_relpath = undefined;

    let controlLabel = document.querySelector('.editor-controls .selected-relpath');
    if (controlLabel) {
        controlLabel.remove();
    }
}

function selectTab(relpath) {
    if (relpath === undefined) {
        return;
    }

    if (_selected_relpath === relpath) {
        return;
    }

    clearSelectedTab();

    _selected_relpath = relpath;
    document.querySelector('.editor-controls').insertAdjacentHTML('beforeend', `
        <span class='selected-relpath'>${relpath}</span>
    `);
}

function open(relpath, filename, mime, contentB64, purpose, readonly) {
    let id = `${relpath}::${purpose}`;

    // Check if this file is already open for editing,
    // and switch to it if possible.
    let tab = _activeFiles[relpath]?.[purpose];
    if (tab !== undefined) {
        tab.parent.parent.setActiveContentItem(tab.parent);
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
}
