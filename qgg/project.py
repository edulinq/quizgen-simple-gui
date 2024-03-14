import base64
import http
import logging
import os

DIRENT_TYPE_FILE = 'file'
DIRENT_TYPE_DIR = 'dir'

ENCODING = 'utf-8'

def fetch_dirent_handler(path, data, project_dir = None, **kwargs):
    if (not os.path.isdir(project_dir)):
        raise ValueError("Project dir does not exist: '%s'." % (str(project_dir)))

    relpath = data.get('path', '').strip()
    if (relpath == ''):
        return http.HTTPStatus.BAD_REQUEST, None, {"message": "No path provided."}

    path = os.path.join(project_dir, relpath)
    if (not os.path.exists(path)):
        message = "Path does not exist within project: '%s'." % (relpath)
        logging.info(message + " Real Path: '%s'." % (path))
        return http.HTTPStatus.BAD_REQUEST, None, {"message": message}

    if (not os.path.isfile(path)):
        return None, None, _get_dirents(path, recursive = False)

    with open(path, 'rb') as file:
        contents = file.read()

    text_contents = base64.standard_b64encode(contents).decode(ENCODING)
    payload = {
        'size': len(contents),
        'contents': text_contents,
    }

    return None, None, payload

def fetch_handler(path, data, project_dir = None, **kwargs):
    if (not os.path.isdir(project_dir)):
        raise ValueError("Project dir does not exist: '%s'." % (str(project_dir)))

    project = {
        "dirents": _get_dirents(project_dir),
    }

    return None, None, project

def _get_dirents(base_dir, recursive = True):
    dirents = []

    for dirent in os.listdir(base_dir):
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
