const MIME_PREFIX_IMG = ['image'];
const MIME_IMG = [];

const MIME_PREFIX_PLAIN = ['text'];
const MIME_PLAIN = ['application/json'];

const MIME_PREFIX_OBJECT = [];
const MIME_OBJECT = ['application/pdf'];

// Render a read-only file.
function file(container, filename, mime, contentB64) {
    let html = '';

    let mimePrefix = undefined;
    if (mime !== null) {
        mimePrefix = mime.split('/')[0];
    }

    if (MIME_PREFIX_IMG.includes(mimePrefix) || MIME_IMG.includes(mime)) {
        html = `<img src='${dataURL(mime, contentB64)}' />`;
    } else if (MIME_PREFIX_PLAIN.includes(mimePrefix) || MIME_PLAIN.includes(mime)) {
        let content = (new TextDecoder('utf-8')).decode(Uint8Array.fromBase64(contentB64));
        html = `<pre>${content}</pre>`;
    } else if (MIME_PREFIX_OBJECT.includes(mimePrefix) || MIME_OBJECT.includes(mime)) {
        html = `<object type='${mime}' data='${dataURL(mime, contentB64)}' width='100%' height='100%'></object>`;
    } else {
        html = `<p>Unsupported document type (${mime}): '${filename}'.</p>`;
    }

    container.innerHTML = html;
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
