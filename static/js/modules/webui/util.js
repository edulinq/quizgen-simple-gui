function init() {
    registerHandler('onKeyEvent', onKeyEvent);
}

// Register a handler and return it's global name.
function registerHandler(name, handler) {
    window.qgg = window.qgg || {};
    window.qgg.handlers = window.qgg.handlers || {};

    window.qgg.handlers[name] = handler;

    return `window.qgg.handlers.${name}`;
}

function onKeyEvent(event, context, keys, handler) {
    if (!keys.includes(event.key)) {
        return;
    }

    handler(event, context);
}

// Look through parents until one matches the specified query.
function queryAncestor(element, query) {
    if (!element) {
        return undefined;
    }

    if (element.parentElement.matches(query)) {
        return element.parentElement;
    }

    return queryAncestor(element.parentElement, query);
}

function caseInsensitiveStringCompare(a, b) {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

// Return a standardized location that always has as leading hash.
function getLocationHash() {
    let hash = window.location.hash.trim();

    if (hash.length === 0) {
        return '#';
    }

    return hash;
}

export {
    caseInsensitiveStringCompare,
    getLocationHash,
    init,
    onKeyEvent,
    queryAncestor,
    registerHandler,
}
