function loadingStart(containerQuery = '.page') {
    let loading = document.createElement('div');
    loading.classList.add('loading');
    loading.innerHTML = `
        <img src='/static/images/loading-basic-edq.png' />
    `;

    let container = document.querySelector(containerQuery);
    container.classList.add('loading-container');
    container.appendChild(loading);
}

function loadingStop(containerQuery = '.page') {
    let container = document.querySelector(containerQuery);
    container.classList.remove('loading-container');

    let loading = container.querySelector('.loading');
    container.removeChild(loading);
}

export {
    loadingStart,
    loadingStop,
}
