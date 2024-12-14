import http
import http.server
import json
import logging
import os
import re
import urllib.parse

import qgg.common
import qgg.handlers
import qgg.project

DEFAULT_PORT = 12345

ROUTES = [
    (r'^/$', qgg.handlers.redirect('/static/index.html')),
    (r'^/index.html$', qgg.handlers.redirect('/static/index.html')),
    (r'^/static$', qgg.handlers.redirect('/static/index.html')),
    (r'^/static/$', qgg.handlers.redirect('/static/index.html')),

    (r'^/favicon.ico$', qgg.handlers.redirect('/static/favicon.ico')),

    (r'^/static/', qgg.handlers.static),
    (r'^/js/', qgg.handlers.rewrite_prefix('^/js/', '/static/js/')),

    qgg.common.build_api_route('project/compile', qgg.project.compile),
    qgg.common.build_api_route('project/fetch', qgg.project.fetch),
    qgg.common.build_api_route('project/file/fetch', qgg.project.fetch_file),
    qgg.common.build_api_route('project/file/save', qgg.project.save_file),
]

def run(project_dir, port = DEFAULT_PORT):
    if (not os.path.isdir(project_dir)):
        raise ValueError("Project dir does not exist: '%s'." % (str(project_dir)))

    logging.info("Starting server on port %s, serving project at '%s'." % (str(port), project_dir))

    _handler.init(project_dir)
    server = http.server.ThreadingHTTPServer(('', port), _handler)

    logging.info("Now listening for requests.")
    server.serve_forever()

class _handler(http.server.BaseHTTPRequestHandler):
    _project_dir = None

    @classmethod
    def init(cls, project_dir, **kwargs):
        project_dir = os.path.abspath(project_dir)
        if (not os.path.isdir(project_dir)):
            raise ValueError('Project directory is not a directory or does not exist.')

        cls._project_dir = project_dir

    def log_message(self, format, *args):
        """
        Reduce the logging noise.
        """

        return

    def handle(self):
        """
        Override handle() to ignore dropped connections.
        """

        try:
            return http.server.BaseHTTPRequestHandler.handle(self)
        except BrokenPipeError as ex:
            logging.info("Connection closed on the client side.")

    def do_POST(self):
        self.handle_request(self._get_post_data)

    def do_GET(self):
        self.handle_request(self._get_get_data)

    def handle_request(self, data_handler):
        logging.debug("Serving: " + self.path)

        code = http.HTTPStatus.OK
        headers = {}

        result = None
        try:
            data = data_handler()
            result = self._route(self.path, data)
        except Exception as ex:
            # An error occured during data handling (routing captures their own errors).
            logging.debug("Error handling '%s'.", self.path, exc_info = ex)
            result = (str(ex), http.HTTPStatus.BAD_REQUEST, None)

        if (result is None):
            # All handling was done internally, the response is complete.
            return

        # A standard response structure was returned, continue processing.
        payload, response_code, response_headers = result

        if (isinstance(payload, dict)):
            payload = json.dumps(payload)
            headers['Content-Type'] = 'application/json'

        if (isinstance(payload, str)):
            payload = payload.encode(qgg.common.ENCODING)

        if (payload is not None):
            headers['Content-Length'] = len(payload)

        if (response_headers is not None):
            for key, value in response_headers.items():
                headers[key] = value

        if (response_code is not None):
            code = response_code

        self.send_response(code)

        for (key, value) in headers.items():
            self.send_header(key, value)
        self.end_headers()

        if (payload is not None):
            self.wfile.write(payload)

    def _route(self, path, params):
        path = path.strip()

        target = qgg.handlers.not_found
        for (regex, handler_func) in ROUTES:
            if (re.search(regex, path) is not None):
                target = handler_func
                break

        try:
            return target(self, path, _handler._project_dir, **params)
        except Exception as ex:
            logging.error("Error on path '%s', handler '%s'.", path, str(target), exc_info = ex)
            return str(ex), http.HTTPStatus.INTERNAL_SERVER_ERROR, None

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
        payload = self.rfile.read(length).decode(qgg.common.ENCODING)

        try:
            request = json.loads(payload)
        except Exception as ex:
            raise ValueError("Payload is not valid json.", ex)

        return request
