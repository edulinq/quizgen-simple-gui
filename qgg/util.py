import http
import logging
import os

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
