// Note that this will be easier once Uint8Array.fromBase64() is widely supported.
// https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#unicode_strings
function textTob64String(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);


    const binaryString = Array.from(bytes, function(byte) {
        return String.fromCodePoint(byte);
    }).join('');

    return btoa(binaryString);
}

// Note that this will be easier once Uint8Array.fromBase64() is widely supported.
// https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#unicode_strings
function b64StringToText(contentB64) {
    const binaryString = atob(contentB64);
    const bytes = Uint8Array.from(binaryString, function(element) {
        return element.codePointAt(0);
    });

    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
}

export {
    b64StringToText,
    textTob64String,
}
