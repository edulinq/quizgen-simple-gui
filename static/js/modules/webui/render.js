/*
 * Low level rendering to DOM elements.
*/

import * as Util from './util.js'

const MIME_PREFIX_IMG = ['image'];
const MIME_IMG = [];

const MIME_PREFIX_OBJECT = [];
const MIME_OBJECT = ['application/pdf'];

const MIME_PREFIX_CODE = ['text'];
const MIME_CODE = ['application/json'];

const DEFAULT_ACE_MODE = 'text';
const EXTENSION_TO_ACE_MODE = {
    'html': 'html',
    'json': 'json5',
    'md': 'markdown',
    'tex': 'latex',
};

let _nextID = 0;

// Render a file.
// Return true if the file can be edited.
function file(parentContainer, relpath, filename, rawMime, contentB64, readonly, clickCallback = undefined) {
    const [mime, classMime, mimePrefix] = parseMime(rawMime);

    let container = document.createElement('div');
    container.id = `file-${String(_nextID++).padStart(3, '0')}`;
    container.classList.add('file', `file-${classMime}`);
    container.dataset.relpath = relpath;

    parentContainer.appendChild(container);

    // Keep track of when the tab was clicked to see which tab has use of the controls.
    if (clickCallback !== undefined) {
        container.addEventListener('click', function(event) {
            clickCallback(relpath);
        });
    }

    if (MIME_PREFIX_CODE.includes(mimePrefix) || MIME_CODE.includes(mime)) {
        let text = Util.b64StringToText(contentB64);
        codeEditor(relpath, container, filename, mime, text, readonly);
        return !readonly;
    }

    let html = '';
    if (MIME_PREFIX_IMG.includes(mimePrefix) || MIME_IMG.includes(mime)) {
        html = `<img src='${dataURL(mime, contentB64)}' />`;
    } else if (MIME_PREFIX_OBJECT.includes(mimePrefix) || MIME_OBJECT.includes(mime)) {
        html = `<object type='${mime}' data='${dataURL(mime, contentB64)}'></object>`;
    } else {
        html = `<p>Unsupported document type (${mime}): '${filename}'.</p>`;
    }

    container.innerHTML = html;
    return false;
}

function parseMime(mime) {
    mime = mime ?? 'unknown'

    let classMime = mime.replace('/', '_');
    let mimePrefix = mime.split('/')[0];

    return [mime, classMime, mimePrefix];
}

function codeEditor(relpath, container, filename, mime, text, readonly) {
    let extension = filename.split('.').pop();
    let mode = EXTENSION_TO_ACE_MODE[extension] ?? DEFAULT_ACE_MODE;

    container.classList.add('code-editor', `code-${extension}`);
    container.textContent = text;

    let editor = ace.edit(container);

    editor.setOptions({
        // Session options.
        'newLineMode': 'unix',
        'useWorker': false,
        'useSoftTabs': true,
        'tabSize': 4,
        'mode': `ace/mode/${mode}`,

        // Render options.
        'showPrintMargin': false,
        'theme': 'ace/theme/github',

        // Editor options.
        'highlightActiveLine': false,
        'highlightSelectedWord': false,
        'readOnly': readonly,
    });

    container.qgg = {
        editor: editor,
    };
}

function dataURL(mime, contentB64) {
    return `data:${mime};base64,${contentB64}`;
}

function fileTree(container, tree, fileClickHandler = undefined, dirClickHandler = expandDir) {
    container.classList.add('file-tree');
    let lines = fileTreeNode(tree);
    container.innerHTML = lines.join("\n");

    // Register click handlers (double for files, single for dirs).
    for (const node of container.querySelectorAll('li.file-tree-dirent')) {
        if (node.classList.contains('file-tree-file')) {
            // Disbale click;
            node.onclick = function(event) {
                event.stopPropagation();
            };

            if (fileClickHandler !== undefined) {
                // Reguster double clck.
                node.addEventListener('dblclick', function(event) {
                    event.stopPropagation();
                    fileClickHandler(event, node, node.dataset.relpath);
                });
            }
        } else {
            if (dirClickHandler !== undefined) {
                node.addEventListener('click', function(event) {
                    event.stopPropagation();
                    dirClickHandler(event, node, node.dataset.relpath);
                });
            }
        }
    }
}

function fileTreeNode(root, lines = []) {
    if ((root === undefined) || (Object.keys(root).length === 0)) {
        return lines;
    }

    lines.push(`<ul class='file-tree-dirents' data-relpath='${root.relpath}'>`);

    for (const node of root.dirents) {
        if (node.type === 'file') {
            const [mime, classMime, mimePrefix] = parseMime(node.mime);
            lines.push(`<li class='file-tree-dirent file-tree-file file-tree-file-${mimePrefix}' data-mime='${mime}' data-relpath='${node.relpath}'><span>${node.name}</span></li>`)
        } else {
            lines.push(`<li class='file-tree-dirent file-tree-dir' data-relpath='${node.relpath}'><span>${node.name}</span>`)
            fileTreeNode(node, lines);
            lines.push(`</li>`);
        }
    }

    lines.push('</ul>')

    return lines;
}

function expandDir(event, dirNode, path) {
    if (dirNode.classList.contains('open')) {
        dirNode.classList.remove('open');
    } else {
        dirNode.classList.add('open');
    }
}

export {
    file,
    fileTree,
}
