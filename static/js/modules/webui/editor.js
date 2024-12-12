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

    container.querySelector('.save').onclick = function(event) {
        save();
    };

    container.querySelector('.compile').onclick = function(event) {
        let format = container.querySelector('.format').value;
        compile(format);
    };
}

function save() {
    // TEST
    console.log("TEST - SAVE");

    // TEST
    // layout.selectedItem
}

function compile(format) {
    // TEST
    console.log("TEST - compile ", format);

    // TEST
    // layout.selectedItem
}

function initLayout() {
    let emptyConfig = {
        settings: {
            selectionEnabled: true,
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
    Render.file(container, params.filename, params.mime, params.contentB64, params.readonly);

    component.on('destroy', function() {
        tabClosed(params.relpath, params.purpose);
    });

    _activeFiles[params.relpath] = _activeFiles[params.relpath] ?? {};
    _activeFiles[params.relpath][params.purpose] = component;
}

function tabClosed(relpath, purpose) {
    delete _activeFiles[relpath][purpose]
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
