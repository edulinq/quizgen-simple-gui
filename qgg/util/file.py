import base64

DEFAULT_ENCODING = 'utf-8'

def to_base64(path, encoding = DEFAULT_ENCODING):
    with open(path, 'rb') as file:
        data = file.read()

    data = base64.standard_b64encode(data)
    return data.decode(DEFAULT_ENCODING)

def from_base64(data, path, encoding = DEFAULT_ENCODING):
    data = base64.b64decode(data.encode(encoding), validate = True)
    with open(path, 'wb') as file:
        file.write(data)
