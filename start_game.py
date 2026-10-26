#!/usr/bin/env python3
"""Serve Elley-Oh! locally and save its story and audio beside the game."""
import argparse
import json
import os
import re
import tempfile
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent
LOCK = threading.RLock()
MAX_STATE = 4 * 1024 * 1024
MAX_AUDIO = 20 * 1024 * 1024
SAFE_ID = re.compile(r'[A-Za-z0-9_-]{1,100}\Z')


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.saving-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


class GameServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, data_dir=None):
        self.data_dir = Path(data_dir) if data_dir else ROOT / 'data'
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.state_file = self.data_dir / 'game.json'
        super().__init__(address, Handler)

    def read_state(self):
        if not self.state_file.exists():
            return {'version': 1, 'world': None, 'soundSettings': None, 'audio': []}
        state = json.loads(self.state_file.read_text('utf-8'))
        if not isinstance(state, dict) or state.get('version') != 1:
            raise ValueError('The game save needs repair; it has not been overwritten.')
        return state

    def save_state(self, state):
        data = json.dumps(state, ensure_ascii=False).encode('utf-8')
        if self.state_file.exists():
            atomic_write(self.data_dir / 'game.previous.json', self.state_file.read_bytes())
        atomic_write(self.state_file, data)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'dist'), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        super().end_headers()

    def allowed(self, write=False):
        hosts = {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'}
        if self.headers.get('Host') not in hosts:
            self.reply(403, {'error': 'Use the local game address.'})
            return False
        if self.headers.get('Sec-Fetch-Site') == 'cross-site':
            self.reply(403, {'error': 'Cross-site access is not allowed.'})
            return False
        origin = self.headers.get('Origin')
        if origin and origin not in {'http://' + h for h in hosts}:
            self.reply(403, {'error': 'This page cannot change your game files.'})
            return False
        if write and self.headers.get('X-Game-Save') != '1':
            self.reply(403, {'error': 'Open the game to save.'})
            return False
        return True

    def reply(self, status, value, content_type='application/json; charset=utf-8'):
        data = json.dumps(value, ensure_ascii=False).encode() if isinstance(value, (dict, list)) else value
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def body(self, maximum):
        size = int(self.headers.get('Content-Length', '-1'))
        if size < 0 or size > maximum:
            raise ValueError('That save or audio file is too large.')
        raw = self.rfile.read(size)
        if len(raw) != size:
            raise ValueError('The upload was interrupted.')
        return raw

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == '/folder-bootstrap.js':
            if not self.allowed():
                return
            try:
                with LOCK:
                    state = self.server.read_state()
                # Stored as an external script; no HTML interpolation.
                data = ('window.FolderBootstrap=' + json.dumps({'enabled': True, 'world': state.get('world'), 'soundSettings': state.get('soundSettings')}, ensure_ascii=True) + ';').encode()
                return self.reply(200, data, 'text/javascript; charset=utf-8')
            except Exception:
                return self.reply(200, b'window.FolderBootstrap={enabled:false,error:"The game-folder save could not be read. Original files were left untouched."};', 'text/javascript; charset=utf-8')
        if path.startswith('/api/'):
            if not self.allowed():
                return
            try:
                with LOCK:
                    state = self.server.read_state()
                    if path == '/api/state':
                        return self.reply(200, state)
                    if path == '/api/audio':
                        return self.reply(200, state.get('audio', []))
                    key = path.removeprefix('/api/audio/')
                    if path.startswith('/api/audio/') and SAFE_ID.fullmatch(key):
                        clip = next((c for c in state['audio'] if c['id'] == key), None)
                        if clip:
                            return self.reply(200, (self.server.data_dir / 'sounds' / (key + '.audio')).read_bytes(), clip['type'])
                return self.reply(404, {'error': 'Not found.'})
            except Exception as error:
                return self.reply(500, {'error': 'Could not read the game folder: ' + str(error)})
        return super().do_GET()

    def do_PUT(self):
        if not self.allowed(write=True):
            return
        path = unquote(urlsplit(self.path).path)
        try:
            with LOCK:
                state = self.server.read_state()
                if path == '/api/state':
                    patch = json.loads(self.body(MAX_STATE))
                    if not isinstance(patch, dict) or not patch or set(patch) - {'world', 'soundSettings'}:
                        raise ValueError('Invalid game save.')
                    if 'world' in patch:
                        w = patch['world']
                        if not isinstance(w, dict) or w.get('format') != 'elley-story' or not isinstance(w.get('levels'), list) or not 1 <= len(w['levels']) <= 50:
                            raise ValueError('Invalid story save.')
                    if 'soundSettings' in patch and not isinstance(patch['soundSettings'], dict):
                        raise ValueError('Invalid sound settings.')
                    state.update(patch)
                elif path.startswith('/api/audio/'):
                    key = path.removeprefix('/api/audio/')
                    if not SAFE_ID.fullmatch(key):
                        raise ValueError('Invalid audio identifier.')
                    mime = self.headers.get('Content-Type', '').split(';')[0]
                    if not re.fullmatch(r'audio/[a-zA-Z0-9.+-]+', mime):
                        raise ValueError('Choose an audio file.')
                    name = unquote(self.headers.get('X-Clip-Name', 'Our sound'))[:80]
                    raw = self.body(MAX_AUDIO)
                    if not raw:
                        raise ValueError('The sound is empty.')
                    atomic_write(self.server.data_dir / 'sounds' / (key + '.audio'), raw)
                    state['audio'] = [c for c in state.get('audio', []) if c['id'] != key] + [{'id': key, 'name': name, 'type': mime, 'size': len(raw)}]
                else:
                    return self.reply(404, {'error': 'Not found.'})
                self.server.save_state(state)
            return self.reply(200, {'saved': True})
        except (ValueError, json.JSONDecodeError) as error:
            return self.reply(400, {'error': str(error)})
        except Exception as error:
            return self.reply(500, {'error': 'Could not save to the game folder: ' + str(error)})

    def do_DELETE(self):
        if not self.allowed(write=True):
            return
        key = unquote(urlsplit(self.path).path).removeprefix('/api/audio/')
        if not self.path.startswith('/api/audio/') or not SAFE_ID.fullmatch(key):
            return self.reply(400, {'error': 'Invalid audio identifier.'})
        try:
            with LOCK:
                state = self.server.read_state()
                state['audio'] = [c for c in state.get('audio', []) if c['id'] != key]
                settings = state.get('soundSettings') or {}
                for event, value in settings.get('slots', {}).items():
                    if value == key:
                        settings['slots'][event] = 'builtin'
                self.server.save_state(state)
                (self.server.data_dir / 'sounds' / (key + '.audio')).unlink(missing_ok=True)
            return self.reply(200, {'saved': True})
        except Exception as error:
            return self.reply(500, {'error': 'Could not delete sound: ' + str(error)})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8767)
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--data-dir', type=Path, help=argparse.SUPPRESS)
    args = parser.parse_args()
    try:
        server = GameServer(('127.0.0.1', args.port), args.data_dir)
    except OSError as error:
        parser.exit(1, f'Could not start: {error}\nClose any older game server on port {args.port}, then try again.\n')
    url = f'http://127.0.0.1:{server.server_port}/map.html'
    print(f'Elley-Oh!: {url}\nSaves: {server.data_dir}\nKeep this window open while playing. Ctrl+C stops the game server.', flush=True)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
