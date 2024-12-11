'use strict;'

let qgg = qgg ?? {};
qgg.render = qgg.render ?? {};

const FORMAT_TO_ACE_LANG_MODE = {
    'html': 'html',
    'tex': 'latex',
};

const OUTPUT_CODE_FORMATS = [
    'html',
    'tex',
];

const OUTPUT_COMPILED_FORMATS = [
    'html',
    'pdf',
];

let _nextID = 0;

let _question_views = {};

async function render_question_code_input(id, path, parentElement) {
    const question = await fetch_question(path);
    const divID = `code-editor-${id}`;

    let container = document.createElement('div');
    container.id = divID;
    container.classList.add('question-container', 'question-input-container', 'code-json', 'code-editor');
    container.textContent = JSON.stringify(question, null, 4);

    parentElement.appendChild(container);

    let editor = ace.edit(divID);
    _question_views[id] = {
        id: id,
        divID: divID,
        element: container,
        editor: editor,
        extraResizeElements: [],
    };

    editor.session.setOptions({
        'mode': 'ace/mode/json5',
        'useWorker': false,
    });

    editor.setOptions({
        'theme': 'ace/theme/github',
        'readOnly': false,
        'showPrintMargin': false,
    });
}

async function render_question_code_output(id, path, format, parentElement) {
    if (!OUTPUT_CODE_FORMATS.includes(format)) {
        throw new Error(`Format '${format}' cannot be rendered as code.`)
    }

    const content = await compile_question(path, format);
    const divID = `code-editor-${id}`;

    let container = document.createElement('div');
    container.id = divID;
    container.classList.add('question-container', 'question-output-container', `code-${format}`, 'code-editor');
    container.textContent = content;

    parentElement.appendChild(container);

    let editor = ace.edit(divID);
    _question_views[id] = {
        id: id,
        divID: divID,
        element: container,
        editor: editor,
        extraResizeElements: [],
    };

    editor.session.setOptions({
        'mode': `ace/mode/${FORMAT_TO_ACE_LANG_MODE[format]}`,
        'useWorker': false,
    });

    editor.setOptions({
        'theme': 'ace/theme/github',
        'readOnly': true,
        'showPrintMargin': false,
    });
}

async function render_question_compiled_output(id, path, format, parentElement) {
    if (!OUTPUT_COMPILED_FORMATS.includes(format)) {
        throw new Error(`Format '${format}' cannot be rendered as compiled.`)
    }

    let content = await compile_question(path, format);
    const divID = `compiled-viewer-${id}`;

    if (format === 'pdf') {
        content = `<embed type="application/pdf" src="data:application/pdf;base64,${content}"/>`
    } else if (format === 'html') {
        // The question is wrapped in a dummy quiz, pull out just the question.
        let element = document.createElement('div');
        element.innerHTML = content;
        content = element.querySelector('.qg-quiz-question').innerHTML;
    }

    let container = document.createElement('div');
    container.id = divID;
    container.classList.add('question-container', 'question-output-container', `compiled-${format}`);
    container.innerHTML = content;

    parentElement.appendChild(container);

    _question_views[id] = {
        id: id,
        divID: divID,
        element: container,
        extraResizeElements: [],
    };

    if (format === 'pdf') {
        _question_views[id].extraResizeElements.push(container.querySelector('embed'));
    }

    return null;
}

// TEST - This funcition is only for testing / establising the API.
async function render_question(path) {
    let container = document.querySelector('.test-area');

    render_question_code_input(_nextID++, path, container);

    render_question_code_output(_nextID++, path, 'html', container);
    render_question_code_output(_nextID++, path, 'tex', container);

    render_question_compiled_output(_nextID++, path, 'html', container);
    render_question_compiled_output(_nextID++, path, 'pdf', container);
}

function createQuestionView(container, params) {
    let id = _nextID++;

    // TODO: Error handling.
    let parentElement = container.getElement()[0];
    let path = params.path || '';
    let type = params.type || 'input';
    let format = params.format || 'html';

    let promise = null;

    if (type === 'input') {
        container.setTitle("JSON");
        promise = render_question_code_input(id, path, parentElement);
    } else if (type === 'output-code') {
        container.setTitle(`${format} (Read Only)`);
        promise = render_question_code_output(id, path, format, parentElement);
    } else {
        container.setTitle(`Compiled ${format} (Read Only)`);
        promise = render_question_compiled_output(id, path, format, parentElement);
    }

    promise.then(function() {
        if (!_question_views.hasOwnProperty(id)) {
            return;
        }

        _question_views[id]['glContainer'] = container;

        // Initial resize.
        resizeViewer(id);

        // Resize with the GL container.
        container.on('resize', function(context) {
            resizeViewer(id);
        });
    });
}

function resizeViewer(id) {
    if (!_question_views.hasOwnProperty(id)) {
        return;
    }

    let element = _question_views[id].element;
    let container = _question_views[id].glContainer;

    element.style.width = `${(container.width || 100)}px`;
    element.style.height = `${(container.height || 100)}px`;

    let extraResizeElements = _question_views[id].extraResizeElements || [];
    extraResizeElements.forEach(function(element) {
        element.style.width = `${(container.width || 100)}px`;
        element.style.height = `${(container.height || 100)}px`;
    });

    let editor = _question_views[id].editor;
    if (editor != null) {
        editor.resize();
    }
}

document.addEventListener("DOMContentLoaded", main);
