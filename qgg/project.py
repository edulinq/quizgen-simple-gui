import http
import mimetypes
import os

import quizgen.project
import quizgen.util.json

import qgg.util.dirent
import qgg.util.file

def fetch(handler, path, project_dir, **kwargs):
    tree = qgg.util.dirent.tree(project_dir)
    _augment_tree(tree, project_dir)

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

def _augment_tree(root, parent_real_path, parent_relpath = None):
    """
    Augment the basic file tree with project/quizgen information.
    """

    if (root is None):
        return root

    real_path = os.path.join(parent_real_path, root['name'])

    relpath = root['name']
    if (parent_relpath is not None):
        # relpaths use URL-style path separators.
        relpath = f"{parent_relpath}/{relpath}"

    root['relpath'] = relpath

    # If this is a file, check its type and return.
    if (root['type'] == 'file'):
        if (root['name'].lower().endswith('.json')):
            data = quizgen.util.json.load_path(real_path)
            root['object_type'] = data.get('type', None)

        return

    # A compile target is the quiz/question that should be compiled
    # when this dirent is selected and the compile button is pressed.
    compile_target = None

    for dirent in root.get('dirents', []):
        _augment_tree(dirent, real_path, relpath)

        # Now that this dirent has been aurmented, check if it is a compile target.
        if (dirent.get('object_type') in ['quiz', 'question']):
            compile_target = dirent['relpath']

    # If we have a compile target, set that to be the target for each file in this dir.
    if (compile_target is not None):
        for dirent in root.get('dirents', []):
            if (dirent['type'] == 'file'):
                dirent['compile_target'] = compile_target
