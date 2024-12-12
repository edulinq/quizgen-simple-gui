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
    Editor.open(relpath, result.filename, result.mime, result.content, 'input', false);
}

function handleFileClick(event, node, path) {
    loadFile(path);
}

export {
    init,
    load,
    loadFile,
}
