import http
import mimetypes
import os
import re

import qgg.common

"""
Handler funcs are functions for handling the core of an API request.
Not to be confused with HTTPHandlers (which handle the low-level HTTP work).

Handler funcs should take as arguments: (http handler, http (url) path, project dir, **kwargs).
Handler funcs should return: (payload, http code (int), headers (dict)).
Any return value can be None and it will be defaulted.
"""

def not_found(handler, path, project_dir, **kwargs):
    return "404 route not found: '%s'." % (path), http.HTTPStatus.NOT_FOUND, None

def redirect(target):
    def handler_func(handler, path, project_dir, **kwargs):
        return None, http.HTTPStatus.MOVED_PERMANENTLY, {'Location': target}

    return handler_func

def rewrite_prefix(prefix, target):
    """
    Rewrite a path's prefix and redirect to that.
    """

    def handler_func(handler, path, project_dir, **kwargs):
        path = re.sub(prefix, target, path)
        return None, http.HTTPStatus.MOVED_PERMANENTLY, {'Location': path}

    return handler_func

# Get a static (bundled) file.
def static(handler, path, project_dir, **kwargs):
    # Note that the path is currently a URL path, and therefore separated with slashes.
    parts = path.strip().split('/')

    # Build the static path skipping the '/static' part of the URL path.
    static_path = os.path.join(qgg.common.STATIC_DIR, *parts[2:])

    return _serve_file(static_path, "static path not found: '%s'." % (path), **kwargs)

def _serve_file(path, not_found_message = None, **kwargs):
    if (not os.path.isfile(path)):
        if (not_found_message is None):
            not_found_message = "path not found: '%s'." % (path)
        return "404 %s" % not_found_message, http.HTTPStatus.NOT_FOUND, None

    with open(path, 'rb') as file:
        data = file.read()

    code = http.HTTPStatus.OK
    headers = {}

    mime_info = mimetypes.guess_type(path)
    if (mime_info is not None):
        headers['Content-Type'] = mime_info[0]

    return data, code, headers
