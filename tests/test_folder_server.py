"""Run with python3 -B -m unittest discover -s tests -p test_folder_server.py -v."""
import importlib.util
import json
import shutil
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

spec = importlib.util.spec_from_file_location('game_server', Path(__file__).resolve().parents[1] / 'start_game.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FolderServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.data = Path(self.temp.name) / 'data'
        self.server = module.GameServer(('127.0.0.1', 0), self.data)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, path, value=None, method=None, headers=None):
        h = {'X-Game-Save': '1'}
        if isinstance(value, dict):
            value = json.dumps(value).encode()
            h['Content-Type'] = 'application/json'
        h.update(headers or {})
        with urlopen(Request(self.url + path, data=value, method=method, headers=h), timeout=5) as response:
            return response.status, response.headers, response.read()

    def test_world_settings_and_previous_save(self):
        world = {'format': 'elley-story', 'levels': [{'title': 'Our world'}]}
        self.request('/api/state', {'world': world}, 'PUT')
        self.request('/api/state', {'soundSettings': {'volume': .4, 'slots': {}}}, 'PUT')
        saved = json.loads((self.data / 'game.json').read_text())
        self.assertEqual(saved['world'], world)
        self.assertEqual(saved['soundSettings']['volume'], .4)
        self.assertEqual(json.loads((self.data / 'game.previous.json').read_text())['world'], world)
        _, _, script = self.request('/folder-bootstrap.js')
        self.assertIn(b'"enabled": true', script)
        self.assertIn(b'Our world', script)

    def test_audio_is_portable_and_delete_resets_assignment(self):
        self.request('/api/audio/my-milk', b'RIFF-test-wave', 'PUT', {'Content-Type': 'audio/wav', 'X-Clip-Name': 'Milk%20song'})
        self.request('/api/state', {'soundSettings': {'volume': .5, 'slots': {'grow': 'my-milk'}}}, 'PUT')
        _, headers, body = self.request('/api/audio/my-milk')
        self.assertEqual(body, b'RIFF-test-wave')
        self.assertEqual(headers['Content-Type'], 'audio/wav')
        copied = Path(self.temp.name) / 'shared-copy'
        shutil.copytree(self.data, copied)
        self.assertEqual(json.loads((copied / 'game.json').read_text())['audio'][0]['name'], 'Milk song')
        self.assertEqual((copied / 'sounds/my-milk.audio').read_bytes(), body)
        self.request('/api/audio/my-milk', method='DELETE')
        state = json.loads((self.data / 'game.json').read_text())
        self.assertEqual(state['audio'], [])
        self.assertEqual(state['soundSettings']['slots']['grow'], 'builtin')
        self.assertFalse((self.data / 'sounds/my-milk.audio').exists())

    def test_rejects_cross_origin_and_unsafe_audio_identifiers(self):
        for headers in [{'Origin': 'https://example.com'}, {'X-Game-Save': '0'}, {'Host': 'example.com'}]:
            with self.assertRaises(HTTPError) as error:
                self.request('/api/state', {'soundSettings': {}}, 'PUT', headers)
            self.assertEqual(error.exception.code, 403)
        with self.assertRaises(HTTPError):
            self.request('/api/audio/%2e%2e%2foutside', b'audio', 'PUT', {'Content-Type': 'audio/wav'})
        self.assertFalse((Path(self.temp.name) / 'outside').exists())

    def test_corrupt_save_is_not_overwritten(self):
        self.data.mkdir(exist_ok=True)
        file = self.data / 'game.json'
        file.write_text('not a JSON save')
        with self.assertRaises(HTTPError):
            self.request('/api/state', {'soundSettings': {}}, 'PUT')
        self.assertEqual(file.read_text(), 'not a JSON save')
        _, _, script = self.request('/folder-bootstrap.js')
        self.assertIn(b'left untouched', script)


if __name__ == '__main__':
    unittest.main()
