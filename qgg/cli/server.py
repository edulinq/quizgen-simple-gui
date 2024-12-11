import argparse
import os
import sys

import quizgen.log

import qgg.server

def run_cli(base_dir = None, port = None, **kwargs):
    if (not os.path.isdir(base_dir)):
        raise ValueError("Project directory '%s' does not exist or is not a directory." % (base_dir))

    qgg.server.run(base_dir, port = port)
    return 0

def main():
    args = _get_parser().parse_args()
    quizgen.log.init_from_args(args)
    return run_cli(**vars(args))

def _get_parser():
    parser = argparse.ArgumentParser(description = "Start the webserver for the Quiz Generator.")

    parser.add_argument('base_dir', metavar = 'PROJECT_DIR',
        action = 'store', type = str,
        help = 'The base directory for the quizgen project the GUI will open.')

    parser.add_argument('--port', dest = 'port',
        action = 'store', type = int, default = qgg.server.DEFAULT_PORT,
        help = 'The port to start the server on (default: %(default)s)')

    quizgen.log.set_cli_args(parser)

    return parser

if (__name__ == '__main__'):
    sys.exit(main())
