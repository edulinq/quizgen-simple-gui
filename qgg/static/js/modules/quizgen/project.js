import * as Core from './core.js'

function compile(relpath, formats) {
    return Core.sendRequest({
        endpoint: 'project/compile',
        payload: {
            'relpath': relpath,
            'formats': formats,
        },
    });
}

function fetch() {
    return Core.sendRequest({
        endpoint: 'project/fetch',
    });
}

function fetchFile(relpath) {
    return Core.sendRequest({
        endpoint: 'project/file/fetch',
        payload: {
            'relpath': relpath,
        },
    });
}

function saveFile(relpath, contentB64) {
    return Core.sendRequest({
        endpoint: 'project/file/save',
        payload: {
            'relpath': relpath,
            'content': contentB64,
        },
    });
}

export {
    compile,
    fetch,
    fetchFile,
    saveFile,
}
