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

export {
    fetch,
    fetchFile,
}
