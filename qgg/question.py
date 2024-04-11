import http
import logging
import os
import sys
import traceback

import quizgen.converter.convert
import quizgen.question.base

import qgg.util

# Cache all question by abs path so we don't have to re-parse.
_question_cache = {}

def fetch_handler(api_path, project_dir, path = '', **kwargs):
    question, error_info = _get_question_from_request(project_dir, path)
    if (error_info is not None):
        return error_info

    return None, None, {
        'path': path,
        'question': question.to_dict(include_docs = False),
    }

def compile_handler(api_path, project_dir, path = '', format = None, key = False, **kwargs):
    if (format is None):
        return http.HTTPStatus.BAD_REQUEST, None, {"message": "No format specified."}

    question, error_info = _get_question_from_request(project_dir, path)
    if (error_info is not None):
        return error_info

    constructor_args = {
        'answer_key': key,
    }

    try:
        content = quizgen.converter.convert.convert_question(question, format = format, constructor_args = constructor_args)
    except Exception as ex:
        message = "Question did not compile to '%s': '%s'." % (format, ex)
        logging.warning("%s Path: '%s'." % (message, path), exc_info = sys.exc_info())
        return http.HTTPStatus.INTERNAL_SERVER_ERROR, None, {
            "locator": -102,
            "message": message,
            'trace': traceback.format_exc(),
        }

    return None, None, {
        'path': path,
        'format': format,
        'content': content,
    }

def _get_question_from_request(project_dir, relpath):
    path, error_info = qgg.util.get_request_relpath(project_dir, relpath)
    if (error_info is not None):
        return None, error_info

    question, error_info = _get_question(path)
    if (error_info is not None):
        return None, error_info

    return question, None

def _get_question(path, cache = True):
    if (not os.path.isfile(path)):
        return None, (http.HTTPStatus.BAD_REQUEST, None, {"message": "Question path is a dir, but should be a file."})

    if (path in _question_cache):
        return _question_cache[path], None

    question, error_info = _parse_question(path)
    if (error_info is not None):
        return None, error_info

    if (cache):
        _question_cache[path] = question

    return question, None

def _parse_question(path):
    try:
        question = quizgen.question.base.Question.from_path(path)
    except Exception as ex:
        message = "Question did not parse: '%s'." % (ex)
        logging.warning("%s Path: '%s'." % (message, path), exc_info = sys.exc_info())
        return http.HTTPStatus.INTERNAL_SERVER_ERROR, None, {
            "locator": -101,
            "message": message,
            'trace': traceback.format_exc(),
        }

    return question, None
