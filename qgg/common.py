import functools
import http
import logging
import os
import re

API_PREFIX = '/api/v01'
ENCODING = 'utf-8'

THIS_DIR = os.path.abspath(os.path.dirname(os.path.realpath(__file__)))
ROOT_DIR = os.path.join(THIS_DIR, '..')
STATIC_DIR = os.path.join(ROOT_DIR, 'static')

PACKAGE_CONFIG_PATH = os.path.join(ROOT_DIR, 'pyproject.toml')

UNKNOWN_VERSION = '?.?.?'
VERSION_REGEX = r'^version\s*=\s*["\'](\d+\.\d+\.\d+)["\']$'

_version = None

def version():
    global _version

    if (_version is not None):
        return _version

    _version = _fetch_version()
    return _version

def _fetch_version():
    if (not os.path.isfile(PACKAGE_CONFIG_PATH)):
        logging.error("Could not find version file: '%s'." % (PACKAGE_CONFIG_PATH))
        return UNKNOWN_VERSION

    with open(PACKAGE_CONFIG_PATH, 'r') as file:
        for line in file:
            line = line.strip()
            if (line == ''):
                continue

            match = re.search(VERSION_REGEX, line)
            if (match is not None):
                return match.group(1)

    logging.error("Could not match version within package config file: '%s'." % (PACKAGE_CONFIG_PATH))
    return UNKNOWN_VERSION

def build_api_route(endpoint, handler_func):
    """
    Build a route (regex, func) for an API endpoint.
    The func should be a standard handler func and will be wrapped via wrap_api_handler().
    """

    regex = rf'^{API_PREFIX}/{endpoint}$'
    handler_func = wrap_api_handler(handler_func, endpoint)

    return (regex, handler_func)

def wrap_api_handler(handler_func, endpoint):
    """
    Wrap a handler func intended for an API endpoint.
    """

    return functools.partial(_call_api_handler, handler_func, endpoint)

def _call_api_handler(handler_func, endpoint, handler, path, project_dir, **kwargs):
    payload = None
    code = http.HTTPStatus.OK
    headers = {}
    message = None

    try:
        result = handler_func(handler, path, project_dir, **kwargs)
        if (result is None):
            return None

        payload, code, headers = result
    except Exception as ex:
        logging.error("Error when handling API endpoint '%s'.", endpoint, exc_info = ex)
        code = http.HTTPStatus.INTERNAL_SERVER_ERROR
        message = str(ex)

    # Deal with defaults.

    if (code is None):
        code = http.HTTPStatus.OK

    # API functions can send a message in the payload spot if the code is not OK.
    if ((code != http.HTTPStatus.OK) and (isinstance(payload, str))):
        message = payload
        payload = None

    if (headers is None):
        headers = {}

    payload = wrap_api_response(payload, code, endpoint, message = message)

    # At this point, mark in the header that the full body should be read.
    # Some errors may not have a JSON body, but we have full content that may have a message.
    headers['qgg-body'] = True

    return payload, code, headers

def wrap_api_response(data, code, endpoint, message = None, success = True):
    """
    Wrap all API responses the same.
    """

    success = (success and (code == http.HTTPStatus.OK))

    return {
        'success': success,
        'message': message,
        'endpoint': endpoint,
        'content': data,
        'server-version': version()
    }
