import base64
import http
import logging
import os

import qgg.util

DIRENT_TYPE_FILE = 'file'
DIRENT_TYPE_DIR = 'dir'

ENCODING = 'utf-8'

def fetch_dirent_handler(api_path, project_dir, path = '', **kwargs):
    path, error_info = qgg.util.get_request_relpath(project_dir, path)
    if (error_info is not None):
        return error_info

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
