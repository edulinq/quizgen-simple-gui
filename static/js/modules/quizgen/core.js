const API_VESION = 'v01';

async function resolveAPIResponse(response) {
    // Check if we should read the full body.
    let readBody = response.headers.get('qgg-body') ?? false;

    if (!response.ok && !readBody) {
        console.error("API returned an error.", response);
        return Promise.reject('QuizGen API returned an error.');
    }

    let body = await response.json();
    if (!body.success) {
        return Promise.reject(`QuizGen API call failed: '${body.message}'.`);
    }

    return Promise.resolve(body.content);
}

async function resolveAPIError(response) {
    console.error("Failed to send API request to QuizGen.");
    console.error(response);

    if (!response.text) {
        return Promise.reject(response);
    }

    let body = await response.text();
    console.error(body);

    return Promise.reject(body);
}

function sendRequest({
        endpoint = undefined,
        payload = {},
        override_email = undefined, override_cleartext = undefined,
        }) {
    if (!endpoint) {
        throw new Error("Endpoint not specified.")
    }

    let url = `/api/${API_VESION}/${endpoint}`;

    let body = JSON.stringify(payload);

    let response = fetch(url, {
        'method': 'POST',
        'body': body,
    });

    return response.then(resolveAPIResponse, resolveAPIError);
}

export {
    sendRequest,
}
