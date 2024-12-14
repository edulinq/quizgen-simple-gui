import * as Core from './core.js'

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
    fetch,
    fetchFile,
    saveFile,
}
