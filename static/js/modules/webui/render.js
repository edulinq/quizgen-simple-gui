/*
 * Low level rendering to DOM elements.
*/

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

function file(parentContainer, filename, mime, contentB64, readonly) {
    mime = mime ?? '???';

    let container = document.createElement('div');
    container.id = `file-${String(_nextID++).padStart(3, '0')}`;
    container.classList.add('file', `file-${mime.replace('/', '_')}`);
    parentContainer.appendChild(container);

    let mimePrefix = undefined;
    if (mime !== null) {
        mimePrefix = mime.split('/')[0];
    }

    if (MIME_PREFIX_CODE.includes(mimePrefix) || MIME_CODE.includes(mime)) {
        let text = (new TextDecoder('utf-8')).decode(Uint8Array.fromBase64(contentB64));
        codeEditor(container, filename, mime, text, readonly);
        return;
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
}

function codeEditor(container, filename, mime, text, readonly) {
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
}

function dataURL(mime, contentB64) {
    return `data:${mime};base64,${contentB64}`;
}

function fileTree(container, root, fileClickHandler = undefined, dirClickHandler = expandDir) {
    container.classList.add('file-tree');
    let lines = fileTreeNode(root, '');
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
                node.ondblclick = function(event) {
                    event.stopPropagation();
                    fileClickHandler(event, node, node.dataset.path);
                };
            }
        } else {
            if (dirClickHandler !== undefined) {
                node.onclick = function(event) {
                    event.stopPropagation();
                    dirClickHandler(event, node, node.dataset.path);
                };
            }
        }
    }
}

function fileTreeNode(root, basePath, lines = []) {
    if (Object.keys(root).length === 0) {
        return lines;
    }

    lines.push(`<ul class='file-tree-dirents' data-path='${basePath}'>`);

    for (const [key, value] of Object.entries(root)) {
        let path = `${basePath}/${key}`;

        if (value === null) {
            lines.push(`<li class='file-tree-dirent file-tree-file' data-path='${path}'><span>${key}</span></li>`)
        } else {
            lines.push(`<li class='file-tree-dirent file-tree-dir' data-path='${path}'><span>${key}</span>`)
            fileTreeNode(value, path, lines);
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
