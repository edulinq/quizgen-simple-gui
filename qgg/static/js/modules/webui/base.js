import * as Editor from './editor.js'
import * as Log from './log.js'
import * as Project from './project.js'

function init() {
    Log.init();

    Project.init();
    Editor.init();

    Project.load();
}

export {
    init,
}
