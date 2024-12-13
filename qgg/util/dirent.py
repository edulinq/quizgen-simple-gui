import mimetypes
import os

def tree(base_dir):
    """
    Create a file tree by recursively descending a file structure.
    Tree nodes will be dicts where keys are dirent names and the value
    is a dict.
    """

    return {
        'type': 'dir',
        'root': True,
        'name': '',
        'dirents': _tree_dirents(base_dir),
    }

def _tree_dirents(base_dir):
    dirents = []

    for dirent in os.listdir(base_dir):
        if ('/' in dirent):
            raise ValueError('File/Dir names cannot have a slash in them. Found "%s".' % (dirent))

        path = os.path.join(base_dir, dirent)

        if (os.path.isdir(path)):
            dirents.append({
                'type': 'dir',
                'root': False,
                'name': dirent,
                'dirents': _tree_dirents(path),
            })
        else:
            mime, _ = mimetypes.guess_type(path)
            dirents.append({
                'type': 'file',
                'name': dirent,
                'mime': mime,
            })

    return dirents
