import http
import mimetypes
import os

import quizgen.constants
import quizgen.converter.convert
import quizgen.project
import quizgen.question.base
import quizgen.quiz
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
    file_path = _rel_file_check(project_dir, relpath)
    if (not isinstance(file_path, str)):
        return file_path

    return _create_api_file(file_path, relpath), None, None

def save_file(handler, path, project_dir, relpath = None, content = None, **kwargs):
    file_path = _rel_file_check(project_dir, relpath)
    if (not isinstance(file_path, str)):
        return file_path

    if (content is None):
        return "Missing 'content'.", http.HTTPStatus.BAD_REQUEST, None

    qgg.util.file.from_base64(content, file_path)

    data = {
        'relpath': relpath,
    }

    return data, None, None

def compile(handler, path, project_dir, relpath = None, format = None, **kwargs):
    file_path = _rel_file_check(project_dir, relpath)
    if (not isinstance(file_path, str)):
        return file_path

    if (format is None):
        return "Missing 'format'.", http.HTTPStatus.BAD_REQUEST, None

    data, success = _compile(file_path, format)
    if (not success):
        return f"Compile failed for '{relpath}': '{data}'.", http.HTTPStatus.BAD_REQUEST, None

    data['relpath'] = relpath

    return data, None, None

def _rel_file_check(project_dir, relpath):
    """
    Standard checks for a relpath that points to a file.
    Returns the resolved path on sucess, or a standard HTTP result tuple on failure.
    """

    if (relpath is None):
        return "Missing 'relpath'.", http.HTTPStatus.BAD_REQUEST, None

    file_path = _resolve_relpath(project_dir, relpath)

    if (not os.path.exists(file_path)):
        return "Relative path '%s' does not exist." % (relpath), http.HTTPStatus.BAD_REQUEST, None

    if (not os.path.isfile(file_path)):
        return "Relative path '%s' is not a file." % (relpath), http.HTTPStatus.BAD_REQUEST, None

    return file_path

def _resolve_relpath(project_dir, relpath):
    """
    Resolve the relative path (which has URL-style path separators ('/')) to an abs path.
    """

    relpath = relpath.strip().removeprefix('/')

    # Split on URL-style path separators and replace with system ones.
    # Note that dirent names with '/' are not allowed.
    relpath = os.sep.join(relpath.split('/'))

    return os.path.abspath(os.path.join(project_dir, relpath))

def _create_api_file(path, relpath):
    content = qgg.util.file.to_base64(path)
    mime, _ = mimetypes.guess_type(path)
    filename = os.path.basename(path)

    return {
        'relpath': relpath,
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
            root['object_type'] = _guess_object_type(real_path)

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

def _guess_object_type(path):
    """
    Given a path a to JSON file, guess what type of QuizGen object it represents.
    Will return either on of quizgen.constants.JSON_OBJECT_TYPES or None.
    """

    data = quizgen.util.json.load_path(path)

    type = data.get('type', None)
    if (type not in quizgen.constants.JSON_OBJECT_TYPES):
        return None

    return type

def _compile(path, format):
    type = _guess_object_type(path)
    if (type is None):
        return "Unable to determine type of QuizGen object.", False

    if (type not in [quizgen.constants.TYPE_QUIZ, quizgen.constants.TYPE_QUESTION]):
        return f"Only quiz and questions can be compiled, found '{type}'.", False

    base_name = type

    if (type == quizgen.constants.TYPE_QUIZ):
        quiz = quizgen.quiz.Quiz.from_path(path)
        variant = quiz.create_variant()
        content = quizgen.converter.convert.convert_variant(variant, format = format)

        base_name = quiz.title
    else:
        question = quizgen.question.base.Question.from_path(path)
        content = quizgen.converter.convert.convert_question(question, format = format)

        if (question.name != ''):
            base_name = question.name

    name = base_name + '.' + format
    mime, _ = mimetypes.guess_type(path)

    data = {
        'filename': name,
        'mime': mime,
        'content': qgg.util.encoding.to_base64(content),
    }

    return data, True
