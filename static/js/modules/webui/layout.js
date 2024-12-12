/*
 * Layout of the editor area.
 */

import * as Render from './render.js'

let _layout = undefined;

function init() {
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

    let editorArea = document.querySelector('.page .editor-area');

    _layout = new GoldenLayout(emptyConfig, editorArea);
    _layout.registerComponent('editor-view', createEditorView);

    // Explicitly handle resizes, so ACE can have explicit dimensions.
    const observer = new ResizeObserver(function(entries) {
        let height = entries[0].contentRect.height;
        let width = entries[0].contentRect.width;
        _layout.updateSize(width, height);
    });
    observer.observe(editorArea);

    _layout.init();
}

function createEditorView(component, params) {
    let container = component.getElement()[0];

    component.setTitle(params.filename);
    Render.file(container, params.filename, params.mime, params.contentB64, params.readonly);
}

function open(filename, mime, contentB64, readonly) {
    let newItem = {
        type: 'component',
        componentName: 'editor-view',
        componentState: {
            filename: filename,
            mime: mime,
            readonly: readonly,
            contentB64: contentB64,
        }
    };

    _layout.root.contentItems[0].addChild(newItem);
}

export {
    init,
    open,
}
