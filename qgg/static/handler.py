import http
import logging
import mimetypes
import os

THIS_DIR = os.path.abspath(os.path.dirname(os.path.realpath(__file__)))
FILES_DIR = os.path.join(THIS_DIR, 'files')
INDEX_FILENAME = 'index.html'

PREFIX = '/static'

def handle(path, data):
    path = path.strip()

    # Note that this is a URL path (so will always have forward slashes).
    if (path.startswith(PREFIX)):
        path = path.replace(PREFIX, '')

    if (path.startswith('/')):
        path = path[1:]

    if (path == ''):
        path = INDEX_FILENAME

    return _handle_file(path)

def _handle_file(relpath):
    path = os.path.join(FILES_DIR, relpath)
    if (not os.path.isfile(path)):
        logging.warning("Found no matching static file for '%s'." % (path))
        return http.HTTPStatus.NOT_FOUND, {}, ''

    code = http.HTTPStatus.OK
    headers = {}

    mime = mimetypes.guess_type(path)
    if (mime[0] is not None):
        headers['content-type'] = mime[0]

    with open(path, 'rb') as file:
        contents = file.read()

    return code, headers, contents
