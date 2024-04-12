'use strict;'

const API_ENDPOINT_QUESTION_FETCH = '/api/v1/question/fetch';
const API_ENDPOINT_QUESTION_COMPILE = '/api/v1/question/compile';

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

let nextID = 0;

// A standard fetch to the API that understands how information and errors are passed.
async function api_get(endpoint, params = {}) {
    let url = new URL(endpoint, window.location.origin);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        if (response.status === 400) {
            const body = await response.json();
            console.error(body);
        } else {
            console.error("Unknown error when fetching question.");
        }

        console.error(response);
        throw new Error(`Failed to get question: '${path}'.`);
    }

    return await response.json();
}

async function fetch_question(path) {
    const body = await api_get(API_ENDPOINT_QUESTION_FETCH, {'path': path});
    return body.question;
}

async function compile_question(path, format) {
    const body = await api_get(API_ENDPOINT_QUESTION_COMPILE, {'path': path, 'format': format});
    return body.content;
}

async function render_question_code_input(path, parentSelector) {
    const question = await fetch_question(path);
    const id = `code-editor-${nextID++}`;

    let container = document.createElement('div');
    container.id = id;
    container.classList.add('question-container', 'question-input-container', 'code-json', 'code-editor');
    container.textContent = JSON.stringify(question, null, 4);

    document.querySelector(parentSelector).appendChild(container);

    let editor = ace.edit(id);

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

async function render_question_code_output(path, format, parentSelector) {
    if (!OUTPUT_CODE_FORMATS.includes(format)) {
        throw new Error(`Format '${format}' cannot be rendered as code.`)
    }

    const content = await compile_question(path, format);
    const id = `code-editor-${nextID++}`;

    let container = document.createElement('div');
    container.id = id;
    container.classList.add('question-container', 'question-output-container', `code-${format}`, 'code-editor');
    container.textContent = content;

    document.querySelector(parentSelector).appendChild(container);

    let editor = ace.edit(id);

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

async function render_question_compiled_output(path, format, parentSelector) {
    if (!OUTPUT_COMPILED_FORMATS.includes(format)) {
        throw new Error(`Format '${format}' cannot be rendered as compiled.`)
    }

    let content = await compile_question(path, format);
    const id = `compiled-viewer-${nextID++}`;

    if (format === 'pdf') {
        content = `<embed type="application/pdf" src="data:application/pdf;base64,${content}"/>`
    }

    let container = document.createElement('div');
    container.id = id;
    container.classList.add('question-container', 'question-output-container', `compiled-${format}`);
    container.innerHTML = content;

    document.querySelector(parentSelector).appendChild(container);
}

// TEST - This funcition is only for testing / establising the API.
async function render_question(path) {
    render_question_code_input(path, '.test-area');

    render_question_code_output(path, 'html', '.test-area');
    render_question_code_output(path, 'tex', '.test-area');

    render_question_compiled_output(path, 'html', '.test-area');
    render_question_compiled_output(path, 'pdf', '.test-area');
}

function main() {
    // TEST
    console.log("TEST - main");

    const TEST_PATH = 'questions/ice-breaker/question.json';
    render_question(TEST_PATH);
}

document.addEventListener("DOMContentLoaded", main);
