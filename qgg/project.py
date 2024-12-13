import http
import mimetypes
import os

import quizgen.project

import qgg.util.dirent
import qgg.util.file

def fetch(handler, path, project_dir, **kwargs):
    tree = qgg.util.dirent.tree(project_dir)
    _augment_tree(tree)

    data = {
        'project': quizgen.project.Project.from_path(project_dir).to_pod(),
        'tree': tree,
        'dirname': os.path.basename(project_dir),
    }

    return data, None, None

def fetch_file(handler, path, project_dir, relpath = None, **kwargs):
    if (relpath is None):
        return "Missing 'relpath'.", http.HTTPStatus.BAD_REQUEST, None

    file_path = _resolve_relpath(project_dir, relpath)

    if (not os.path.exists(file_path)):
        return "Relative path '%s' does not exist." % (relpath), http.HTTPStatus.BAD_REQUEST, None

    if (not os.path.isfile(file_path)):
        return "Relative path '%s' is not a file." % (relpath), http.HTTPStatus.BAD_REQUEST, None

    data = {
        'relpath': relpath,
        'content': qgg.util.file.to_base64(file_path),
    }

    return _create_api_file(file_path), None, None

def _resolve_relpath(project_dir, relpath):
    """
    Resolve the relative path (which has URL-style path separators ('/')) to an abs path.
    """

    relpath = relpath.strip().removeprefix('/')

    # Split on URL-style path separators and replace with system ones.
    # Note that dirent names with '/' are not allowed.
    relpath = os.sep.join(relpath.split('/'))

    return os.path.abspath(os.path.join(project_dir, relpath))

def _create_api_file(path):
    content = qgg.util.file.to_base64(path)
    mime, _ = mimetypes.guess_type(path)
    filename = os.path.basename(path)

    return {
        'content': content,
        'mime': mime,
        'filename': filename,
    }

def _augment_tree(root, base_dir = None):
    """
    Augment the basic file tree with project/quizgen information.
    """

    if (root is None):
        return root

    relpath = root['name']
    if (base_dir is not None):
        # relpaths use URL-style path separators.
        relpath = f"{base_dir}/{relpath}"

    root['relpath'] = relpath

    for dirent in root.get('dirents', []):
        _augment_tree(dirent, relpath)
