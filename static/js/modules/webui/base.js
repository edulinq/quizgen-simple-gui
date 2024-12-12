import * as Editor from './editor.js'
import * as Log from './log.js'
import * as Project from './project.js'
import * as Util from './util.js'

function init() {
    initHandlers();

    // Init utils first.
    Log.init();
    Util.init();

    Project.init();
    Editor.init();

    Project.load();
}

function initHandlers() {
    window.qgg = window.qgg || {};
    window.qgg.handlers = window.qgg.handlers || {};
}

export {
    init,
}
