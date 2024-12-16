import http
import mimetypes
import os

import quizgen.constants
import quizgen.converter.convert
import quizgen.pdf
import quizgen.project
import quizgen.question.base
import quizgen.quiz
import quizgen.util.dirent
import quizgen.util.json

import qgg.util.dirent
import qgg.util.file

# Compiled output filename extensions will take the value of the format if not overwritten here.
OVERRIDE_EXTENSIONS = {
    'canvas': 'canvas.html',
}

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

def compile(handler, path, project_dir, relpath = None, formats = None, **kwargs):
    file_path = _rel_file_check(project_dir, relpath)
    if (not isinstance(file_path, str)):
        return file_path

    if (formats is None):
        return "Missing 'formats'.", http.HTTPStatus.BAD_REQUEST, None

    result = {}
    for format in formats:
        data, success = _compile(file_path, format)
        if (not success):
            return f"Compile failed for '{relpath}' ({format}): '{data}'.", http.HTTPStatus.BAD_REQUEST, None

        data['relpath'] = relpath

        result[format] = data

    return result, None, None

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
            root['objectType'] = _guess_object_type(real_path)

        return

    # A compile target is the quiz/question that should be compiled
    # when this dirent is selected and the compile button is pressed.
    compile_target = None

    for dirent in root.get('dirents', []):
        _augment_tree(dirent, real_path, relpath)

        # Now that this dirent has been aurmented, check if it is a compile target.
        if (dirent.get('objectType') in ['quiz', 'question']):
            compile_target = dirent['relpath']

    # If we have a compile target, set that to be the target for each file in this dir.
    if (compile_target is not None):
        for dirent in root.get('dirents', []):
            if (dirent['type'] == 'file'):
                dirent['compileTarget'] = compile_target

def _guess_object_type(path):
    """
    Given a path a to JSON file, guess what type of QuizGen object it represents.
    Will return either on of quizgen.constants.JSON_OBJECT_TYPES or None.
    """

    data = quizgen.util.json.load_path(path)

    # First, look at the 'type' field.
    type = data.get('type', None)
    if (type in quizgen.constants.JSON_OBJECT_TYPES):
        return type

    # Try to guess based on other attributes.

    if ('title' in data):
        return quizgen.constants.TYPE_QUIZ

    if ('question_type' in data):
        return quizgen.constants.TYPE_QUESTION

    return None

def _compile(path, format):
    type = _guess_object_type(path)
    if (type is None):
        return "Unable to determine type of QuizGen object.", False

    if (type not in [quizgen.constants.TYPE_QUIZ, quizgen.constants.TYPE_QUESTION]):
        return f"Only quiz and questions can be compiled, found '{type}'.", False

    base_name = type

    if (type == quizgen.constants.TYPE_QUIZ):

        if (format == 'pdf'):
            content, base_name = _make_pdf(path)
        else:
            quiz = quizgen.quiz.Quiz.from_path(path)
            base_name = quiz.title

            variant = quiz.create_variant()

            content = quizgen.converter.convert.convert_variant(variant, format = format)
    else:
        question = quizgen.question.base.Question.from_path(path)
        content = quizgen.converter.convert.convert_question(question, format = format)

        if (question.name != ''):
            base_name = question.name

    extension = OVERRIDE_EXTENSIONS.get(format, format)
    name = base_name + '.' + extension
    mime, _ = mimetypes.guess_type(name)

    data = {
        'filename': name,
        'mime': mime,
        'content': qgg.util.encoding.to_base64(content),
    }

    return data, True

def _make_pdf(path):
    temp_dir = quizgen.util.dirent.get_temp_path('qgg-pdf-')
    quiz, _, _ = quizgen.pdf.make_with_path(path, skip_key = True, base_out_dir = temp_dir)

    out_path = os.path.join(temp_dir, quiz.title, f"{quiz.title}.pdf")
    if (not os.path.isfile(out_path)):
        raise ValueError(f"Unable to find PDF output in: '{out_path}'.")

    with open(out_path, 'rb') as file:
        data = file.read()

    return data, quiz.title
