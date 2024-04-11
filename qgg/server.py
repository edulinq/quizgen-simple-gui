import http
import http.server
import json
import logging
import os
import re
import traceback
import urllib.parse

import qgg.static.handler
import qgg.project
import qgg.question

DEFAULT_PORT = 12345
ENCODING = 'utf-8'

ROUTES = {
    r'^$': qgg.static.handler.handle,
    r'^/favicon.ico$': qgg.static.handler.handle,

    r'^/static$': qgg.static.handler.handle,
    r'^/static/': qgg.static.handler.handle,

    r'^/api/v1/project/fetch$': qgg.project.fetch_handler,
    r'^/api/v1/dirent/fetch': qgg.project.fetch_dirent_handler,

    r'^/api/v1/question/fetch': qgg.question.fetch_handler,
    r'^/api/v1/question/compile': qgg.question.compile_handler,
}

def start(project_dir, port = DEFAULT_PORT):
    if (not os.path.isdir(project_dir)):
        raise ValueError("Project dir does not exist: '%s'." % (str(project_dir)))

    logging.info("Starting server on port %s, serving project at '%s'." % (str(port), project_dir))

    _handler._project_dir = project_dir
    server = http.server.ThreadingHTTPServer(('', port), _handler)

    logging.info("Now listening for requests.")
    server.serve_forever()

class _handler(http.server.BaseHTTPRequestHandler):
    _project_dir = None

    def do_POST(self):
        self.handle_request(self._get_post_data)

    def do_GET(self):
        self.handle_request(self._get_get_data)

    def handle_request(self, data_handler):
        try:
            data = data_handler()
            code, headers, payload = self._route(data)
        except Exception as ex:
            traceback.print_exc()

            code = http.HTTPStatus.INTERNAL_SERVER_ERROR
            headers = {'content-type': 'application/json'}

            response = {
                'locator': 0,
                'status': 'failed',
                'message': "Server encountered an error: '%s'" % (ex),
                'trace': traceback.format_exc(),
            }
            payload = json.dumps(response).encode(ENCODING)

        if (code is None):
            code = http.HTTPStatus.OK

        if (headers is None):
            headers = {}

        if (isinstance(payload, str)):
            payload = payload.encode(ENCODING)
        elif (not isinstance(payload, bytes)):
            payload = json.dumps(payload).encode(ENCODING)
            headers['content-type'] = 'application/json'

        self.send_response(code)
        for (key, value) in headers.items():
            self.send_header(key, value)
        self.end_headers()

        self.wfile.write(payload)

    def _route(self, data):
        """
        Handle routing and calling handlers.
        Handlers should take: (api_path, project_dir, **params).
        Handlers should return: (http_code (int), headers (dict), payload (bytes)).
        """

        path = self.path.strip().rstrip('/')
        url = urllib.parse.urlparse(path)
        clean_path = url.path.strip()

        for (prefix, handler) in ROUTES.items():
            if (re.search(prefix, clean_path) is not None):
                return handler(clean_path, _handler._project_dir, **data)

        logging.warning("Found no matching route for '%s'." % (path))
        return http.HTTPStatus.NOT_FOUND, {}, ''

    def _get_get_data(self):
        path = self.path.strip().rstrip('/')
        url = urllib.parse.urlparse(path)

        raw_params = urllib.parse.parse_qs(url.query)
        params = {}

        for (key, values) in raw_params.items():
            if ((len(values) == 0) or (values[0] == '')):
                continue
            elif (len(values) == 1):
                params[key] = values[0]
            else:
                params[key] = values

        return params

    def _get_post_data(self):
        length = int(self.headers['Content-Length'])
        payload = self.rfile.read(length).decode(ENCODING)

        try:
            request = json.loads(payload)
        except Exception as ex:
            raise ValueError("Payload is not valid json.", ex)

        return request
