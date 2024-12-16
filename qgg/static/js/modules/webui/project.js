import * as Common from './common.js'
import * as Editor from './editor.js'
import * as Log from './log.js'
import * as Render from './render.js'

import * as QuizGen from '/js/modules/quizgen/base.js'

function init() {
}

function load() {
    Common.loadingStart();

    QuizGen.Project.fetch()
        .then(function(result) {
            let container = document.querySelector('.file-manager');
            Render.fileTree(container, result.tree, handleFileClick);
            Editor.setProject(result.project, result.tree);
        })
        .catch(function(result) {
            Log.error(result);
        })
        .finally(function() {
            Common.loadingStop();
        })
    ;
}

function loadFile(relpath) {
    Common.loadingStart('.editor-area');

    QuizGen.Project.fetchFile(relpath)
        .then(function(result) {
            openEditor(relpath, result);
        })
        .catch(function(result) {
            Log.error(result);
        })
        .finally(function() {
            Common.loadingStop('.editor-area');
        })
    ;
}

function openEditor(relpath, result) {
    Editor.openEditor(relpath, result.filename, result.mime, result.content, false);
}

function handleFileClick(event, node, relpath) {
    if (Editor.hasOpenTab(relpath)) {
        // Even if we will not load the file,
        // we should inform the editor to set this as the active file.
        Editor.selectTab(relpath);
    } else {
        loadFile(relpath);
    }
}

export {
    init,
    load,
    loadFile,
}
