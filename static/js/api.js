'use strict;'

let qgg = qgg ?? {};
qgg.api = qgg.api ?? {};

// TEST
const API_ENDPOINT_QUESTION_FETCH = '/api/v1/question/fetch';
const API_ENDPOINT_QUESTION_COMPILE = '/api/v1/question/compile';

// TEST
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

// TEST
async function fetch_question(path) {
    const body = await api_get(API_ENDPOINT_QUESTION_FETCH, {'path': path});
    return body.question;
}

// TEST
async function compile_question(path, format) {
    const body = await api_get(API_ENDPOINT_QUESTION_COMPILE, {'path': path, 'format': format});
    return body.content;
}
