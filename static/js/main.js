import * as WebUI from './modules/webui/base.js'

function main() {
    WebUI.init();
}

document.addEventListener("DOMContentLoaded", main);

/* TEST
'use strict;'

function main() {
    // TEST
    console.log("TEST - main");

    const TEST_PATH = 'questions/ice-breaker/question.json';
    // TEST
    // render_question(TEST_PATH);

    let layoutConfig = {
        content: [
            {
                type: 'row',
                content:[
                    {
                        type: 'component',
                        componentName: 'question-view',
                        componentState: {
                            path: TEST_PATH,
                            type: 'input',
                        }
                    },
                    {
                        type: 'column',
                        content:[
                            {
                                type: 'component',
                                componentName: 'question-view',
                                componentState: {
                                    path: TEST_PATH,
                                    type: 'output-code',
                                    format: 'html',
                                }
                            },
                            {
                                type: 'component',
                                componentName: 'question-view',
                                componentState: {
                                    path: TEST_PATH,
                                    type: 'output-compiled',
                                    format: 'html',
                                }
                            },
                        ]
                    },
                    {
                        type: 'column',
                        content:[
                            {
                                type: 'component',
                                componentName: 'question-view',
                                componentState: {
                                    path: TEST_PATH,
                                    type: 'output-code',
                                    format: 'tex',
                                }
                            },
                            {
                                type: 'component',
                                componentName: 'question-view',
                                componentState: {
                                    path: TEST_PATH,
                                    type: 'output-compiled',
                                    format: 'pdf',
                                }
                            },
                        ]
                    },
                ]
            }
        ]
    };

    let editArea = document.querySelector('.test-area');

    let layout = new GoldenLayout(layoutConfig, editArea);
    layout.registerComponent('question-view', createQuestionView);

    const observer = new ResizeObserver(function(entries) {
        let height = entries[0].contentRect.height;
        let width = entries[0].contentRect.width;
        layout.updateSize(width, height);
    });
    observer.observe(editArea);

    layout.init();
}

document.addEventListener("DOMContentLoaded", main);
*/
