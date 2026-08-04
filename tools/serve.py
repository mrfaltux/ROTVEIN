#!/usr/bin/env python3
"""ROTVEIN — local dev server.

ES modules cannot be loaded over file://, so open the game through this
instead of double-clicking index.html:

    python3 tools/serve.py          # http://localhost:8000
    python3 tools/serve.py 5173     # pick a port

It serves the repository root, sends the right MIME types for .js/.json,
and disables caching so a reload always shows the code you just wrote.
"""

import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.html': 'text/html',
        '.svg': 'image/svg+xml',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write('  %s\n' % (fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(Handler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', port), handler) as httpd:
        print(f'ROTVEIN serving {ROOT}')
        print(f'  → http://localhost:{port}/   (ctrl-c to stop)')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nstopped.')


if __name__ == '__main__':
    main()
