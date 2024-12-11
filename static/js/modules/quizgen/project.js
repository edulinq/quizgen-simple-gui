import * as Core from './core.js'

function fetch() {
    return Core.sendRequest({
        endpoint: 'project/fetch',
    });
}

export {
    fetch,
}
