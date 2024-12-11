import * as QuizGen from '/js/modules/quizgen/base.js'
import * as Log from './log.js'

function init() {
    // TEST
    console.log('TEST - init');
}

function load() {
    // TEST
    console.log('TEST - load');

    // TEST
    QuizGen.Project.fetch()
        .then(function(result) {
            // TEST
            console.log("FETCH");
            console.log(result);
        })
        .catch(function(result) {
            Log.error(result);
        })
    ;
}

export {
    init,
    load,
}
