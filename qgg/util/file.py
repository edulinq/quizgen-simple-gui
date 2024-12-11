import base64

DEFAULT_ENCODING = 'utf-8'

def to_base64(path, encoding = DEFAULT_ENCODING):
    with open(path, 'rb') as file:
        data = file.read()

    content = base64.standard_b64encode(data)
    return content.decode(DEFAULT_ENCODING)

def from_base64(contents, encoding = DEFAULT_ENCODING):
    return base64.b64decode(contents.encode(encoding), validate = True)
