import multiprocessing
import os
import sys
import time
import webbrowser

import quizgen.args

import qgg.server

def run_cli(base_dir = None, port = None, no_browser = None, **kwargs):
    if (not os.path.isdir(base_dir)):
        raise ValueError("Project directory '%s' does not exist or is not a directory." % (base_dir))

    # A queue that we will put something in if the server has been stopped.
    server_done_queue = multiprocessing.SimpleQueue()

    # Open a browser window in the background.
    browser_open_process = None
    if (not no_browser):
        browser_open_process = multiprocessing.Process(target = _open_browser, args = (server_done_queue, f"http://127.0.0.1:{port}"))
        browser_open_process.start()

    try:
        qgg.server.run(base_dir, port = port)
    finally:
        server_done_queue.put(True)

        if (browser_open_process is not None):
            browser_open_process.join()

    return 0

def _open_browser(server_done_queue, address, delay_secs = 0.5):
    """
    Wait a bit and then try to open a web browser.
    """

    # Check the queue for an indication to stop.
    if (not server_done_queue.empty()):
        return

    time.sleep(delay_secs)

    # Check the queue (again) for an indication to stop.
    if (not server_done_queue.empty()):
        return

    webbrowser.open(address)

def main():
    args = _get_parser().parse_args()
    return run_cli(**vars(args))

def _get_parser():
    parser = quizgen.args.Parser(description = "Start the webserver for the Quiz Generator.")

    parser.add_argument('base_dir', metavar = 'PROJECT_DIR',
        action = 'store', type = str, nargs = '?', default = '.',
        help = 'The base directory for the quizgen project the GUI will open (default: %(default)s)')

    parser.add_argument('--port', dest = 'port',
        action = 'store', type = int, default = qgg.server.DEFAULT_PORT,
        help = 'The port to start the server on (default: %(default)s)')

    parser.add_argument('--no-browser', dest = 'no_browser',
        action = 'store_true',
        help = 'Do not try to open a web browser when launching (default: %(default)s)')

    return parser

if (__name__ == '__main__'):
    sys.exit(main())
