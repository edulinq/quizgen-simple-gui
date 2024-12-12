import os

def tree(base_dir):
    """
    Create a file tree by recursively descending a file structure.
    Tree nodes will be dicts where keys are dirent names and the value
    is None for files and another tree node for dirs.
    """

    root = {}

    for dirent in os.listdir(base_dir):
        if ('/' in dirent):
            raise ValueError('File/Dir names cannot have a slash in them. Found "%s".' % (dirent))

        path = os.path.join(base_dir, dirent)
        if (os.path.isdir(path)):
            root[dirent] = tree(path)
        else:
            root[dirent] = None

    return root
