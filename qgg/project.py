import base64
import http
import logging
import os

DIRENT_TYPE_FILE = 'file'
DIRENT_TYPE_DIR = 'dir'

# TEST
ENCODING = 'utf-8'

# TEST
def fetch(handler, path, **kwargs):
    # TEST
    print("TEST")

    return None, None, None

def fetch_dirent_handler(api_path, project_dir, path = '', **kwargs):
    # TEST
    raise ValueError("TEST - This needs changes")
    path, error_info = get_request_relpath(project_dir, path)
    if (error_info is not None):
        return error_info

    if (not os.path.isfile(path)):
        return None, None, _get_dirents(path, recursive = False)

    with open(path, 'rb') as file:
        contents = file.read()

    # TEST
    text_contents = base64.standard_b64encode(contents).decode(ENCODING)
    payload = {
        'size': len(contents),
        'contents': text_contents,
    }

    return None, None, payload

def fetch_handler(api_path, project_dir, **kwargs):
    project = {
        "dirents": _get_dirents(project_dir),
    }

    return None, None, project

def _get_dirents(base_dir, recursive = True):
    dirents = []

    for dirent in sorted(os.listdir(base_dir)):
        path = os.path.join(base_dir, dirent)

        if (os.path.isfile(path)):
            dirents.append({
                'type': DIRENT_TYPE_FILE,
                'name': dirent,
            })
        else:
            data = {
                'type': DIRENT_TYPE_DIR,
                'name': dirent,
            }

            if (recursive):
                data['dirents'] = _get_dirents(path)

            dirents.append(data)

    return dirents

def get_request_relpath(project_dir, relpath):
    """
    On success, returns: abs_path, None
    On failure, returns: None, (status, headers, payload)
    """

    relpath = relpath.strip()
    if (relpath == ''):
        return None, (http.HTTPStatus.BAD_REQUEST, None, {"message": "No path provided."})

    path = os.path.abspath(os.path.join(project_dir, relpath))
    if (not os.path.exists(path)):
        message = "Path does not exist within project: '%s'." % (relpath)
        logging.info(message + " Real Path: '%s'." % (path))
        return None, (http.HTTPStatus.BAD_REQUEST, None, {"message": message})

    return path, None
