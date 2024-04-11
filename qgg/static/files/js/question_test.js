'use strict;'

const API_ENDPOINT_QUESTION_FETCH = '/api/v1/question/fetch';
const API_ENDPOINT_QUESTION_COMPILE = '/api/v1/question/compile';

const FORMAT_TO_ACE_LANG_MODE = {
    'html': 'html',
    'tex': 'latex',
};

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

async function render_question_input(path, parentSelector) {
    const question = await fetch_question(path);
    const id = `code-editor-${nextID++}`;

    let container = document.createElement('div');
    container.id = id;
    container.classList.add('question-container', 'question-input-container', 'language-json', 'code-editor');
    container.textContent = JSON.stringify(question, null, 4);

    document.querySelector(parentSelector).appendChild(container);

    let editor = ace.edit(id);
    editor.session.setMode('ace/mode/json5');
    editor.session.setUseWorker(false);
    editor.setTheme('ace/theme/github');

    editor.setReadOnly(true);
}

async function render_question_output(path, format, parentSelector) {
    const content = await compile_question(path, format);
    const id = `code-editor-${nextID++}`;

    let container = document.createElement('div');
    container.id = id;
    container.classList.add('question-container', 'question-output-container', `language-${format}`, 'code-editor');
    container.textContent = content;

    document.querySelector(parentSelector).appendChild(container);

    let editor = ace.edit(id);
    editor.session.setMode(`ace/mode/${FORMAT_TO_ACE_LANG_MODE[format]}`);
    editor.session.setUseWorker(false);
    editor.setTheme('ace/theme/github');
    editor.setReadOnly(true);
}

// TEST - This funcition is only for testing / establising the API.
async function render_question(path) {
    render_question_input(path, '.test-area');
    render_question_output(path, 'html', '.test-area');
    render_question_output(path, 'tex', '.test-area');
}

function main() {
    // TEST
    console.log("TEST - main");

    const TEST_PATH = 'questions/ice-breaker/question.json';
    render_question(TEST_PATH);
}

document.addEventListener("DOMContentLoaded", main);
