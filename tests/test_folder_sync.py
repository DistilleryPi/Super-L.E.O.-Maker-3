"""Two windows saving the same story through the launcher must not erase each other's work.

Each simulated tab runs the real folder-store.js and world.js in JavaScriptCore and talks to the
real start_game.py server. Run with: python3 -B tests/test_folder_sync.py (Linux with JavaScriptCore).
"""
import ctypes
import importlib.util
import json
import pathlib
import tempfile
import threading
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('game_server', ROOT / 'start_game.py')
server_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)

j = ctypes.CDLL('libjavascriptcoregtk-4.1.so.0')
j.JSGlobalContextCreate.restype = ctypes.c_void_p
j.JSGlobalContextCreate.argtypes = [ctypes.c_void_p]
j.JSStringCreateWithUTF8CString.restype = ctypes.c_void_p
j.JSStringCreateWithUTF8CString.argtypes = [ctypes.c_char_p]
j.JSEvaluateScript.restype = ctypes.c_void_p
j.JSEvaluateScript.argtypes = [ctypes.c_void_p] * 4 + [ctypes.c_int, ctypes.POINTER(ctypes.c_void_p)]
j.JSValueToStringCopy.restype = ctypes.c_void_p
j.JSValueToStringCopy.argtypes = [ctypes.c_void_p] * 3
j.JSStringGetMaximumUTF8CStringSize.restype = ctypes.c_size_t
j.JSStringGetMaximumUTF8CStringSize.argtypes = [ctypes.c_void_p]
j.JSStringGetUTF8CString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_size_t]

# A minimal browser page: DOM events, storage, fetch and BroadcastChannel are handed to Python.
STUB = r"""
const window=globalThis,noop=()=>{},listeners={},elements={};
const on=scope=>(type,fn)=>(listeners[scope+type]??=[]).push(fn);
const fire=(scope,event)=>(listeners[scope+event.type]||[]).forEach(fn=>fn(event));
class Event{constructor(type){this.type=type}}
class CustomEvent extends Event{constructor(type,init){super(type);this.detail=init?.detail}}
const document={hidden:false,activeElement:{tagName:'BODY'},addEventListener:on('doc:'),dispatchEvent:e=>{fire('doc:',e);return true},
 getElementById:id=>elements[id]||null,createElement:()=>({setAttribute(k,v){this[k]=v}}),querySelector:s=>s==='main'?{prepend:el=>elements[el.id]=el}:null};
window.addEventListener=on('win:');
const store=new Map(),localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))},sessionStorage=localStorage;
let uuid=0;const crypto={randomUUID:()=>'TAB-'+(++uuid)};
const setTimeout=()=>0,clearTimeout=noop,alert=noop;
const outbox=[],replies=new Map();let requestCount=0;
function fetch(path,options={}){const id=++requestCount;outbox.push({id,path,method:options.method||'GET',headers:options.headers||{},body:options.body??null});return new Promise(resolve=>replies.set(id,resolve))}
function reply(id,status,text){replies.get(id)({ok:status>=200&&status<300,status,json:async()=>JSON.parse(text)});replies.delete(id)}
const broadcasts=[];class BroadcastChannel{constructor(){BroadcastChannel.open=this}postMessage(m){broadcasts.push(JSON.stringify(m))}}
function hear(text){BroadcastChannel.open.onmessage?.({data:JSON.parse(text)})}
"""


class Tab:
    def __init__(self, url, browser, name):
        self.url, self.browser = url, browser
        self.ctx = j.JSGlobalContextCreate(None)
        self.run(STUB.replace('TAB', name))
        with urlopen(url + '/folder-bootstrap.js', timeout=5) as response:
            self.run(response.read().decode())
        for script in ('folder-store.js', 'world.js'):
            self.run((ROOT / 'dist' / script).read_text())
        self.run("var storyChanges=0;document.addEventListener('storychange',()=>storyChanges++);var W=window.StoryWorld;W.load();")

    def run(self, code):
        error = ctypes.c_void_p()
        value = j.JSEvaluateScript(self.ctx, j.JSStringCreateWithUTF8CString(code.encode()), None, None, 1, ctypes.byref(error))
        text = j.JSValueToStringCopy(self.ctx, error.value or value, None)
        size = j.JSStringGetMaximumUTF8CStringSize(text)
        buffer = ctypes.create_string_buffer(size)
        j.JSStringGetUTF8CString(text, buffer, size)
        if error.value:
            raise AssertionError(buffer.value.decode())
        return buffer.value.decode()

    def take(self, queue):
        return json.loads(self.run(f'JSON.stringify({queue}.splice(0))'))

    def call_server(self, req):
        body = req['body'].encode() if req['body'] is not None else None
        try:
            with urlopen(Request(self.url + req['path'], data=body, method=req['method'], headers=req['headers']), timeout=5) as response:
                return response.status, response.read().decode()
        except HTTPError as error:
            return error.code, error.read().decode()


def settle(tabs):
    """Answer every request and pass broadcasts to other tabs of the same browser until all is quiet."""
    for _ in range(100):
        busy = False
        for tab in tabs:
            for req in tab.take('outbox'):
                busy = True
                status, text = tab.call_server(req)
                tab.run(f'reply({req["id"]},{status},{json.dumps(text)})')
            for message in tab.take('broadcasts'):
                busy = True
                for other in tabs:
                    if other is not tab and other.browser == tab.browser:
                        other.run(f'hear({json.dumps(message)})')
            tab.run('0')  # let promise callbacks run
        if not busy:
            return
    raise AssertionError('saves never settled')


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    server_module.Handler.log_message = lambda *args: None
    temp = tempfile.TemporaryDirectory()
    server = server_module.GameServer(('127.0.0.1', 0), pathlib.Path(temp.name) / 'data')
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}'
    saved = lambda: json.loads((pathlib.Path(temp.name) / 'data' / 'game.json').read_text())['world']
    try:
        first = Tab(url, 'firefox', 'seed')
        settle([first])
        chapter = saved()['levels'][0]['id']

        # Two tabs in one browser: the World Maker tab and a level builder opened in the background.
        world_maker, builder = Tab(url, 'firefox', 'map'), Tab(url, 'firefox', 'build')
        builder.run(f'W.select({json.dumps(saved()["levels"][1]["id"])})')
        settle([world_maker, builder])
        world_maker.run("W.updateStory('Title typed in World Maker','Our intro')")
        settle([world_maker, builder])
        builder.run(f"W.updateChapter({json.dumps(chapter)},'Renamed in the builder','A story')")
        settle([world_maker, builder])
        check(saved()['title'] == 'Title typed in World Maker', 'two tabs: the World Maker change was erased')
        check(saved()['levels'][0]['level']['title'] == 'Renamed in the builder', 'two tabs: the builder change was lost')
        check(world_maker.run('W.get().levels[0].level.title') == 'Renamed in the builder', 'two tabs: World Maker did not refresh')
        check(int(world_maker.run('storyChanges')) > 0, 'two tabs: no storychange event for the page to redraw')
        check(world_maker.run('FolderSave.conflict') == 'false' and builder.run('FolderSave.conflict') == 'false', 'two tabs: unexpected conflict')

        # Two browsers: no shared channel, so switching windows has to pick up the newer save.
        firefox, chrome = Tab(url, 'firefox', 'ff'), Tab(url, 'chrome', 'chrome')
        firefox.run("W.updateStory('Title typed in Firefox','Our intro')")
        settle([firefox, chrome])
        chrome.run("fire('win:',new Event('focus'))")
        settle([firefox, chrome])
        check(chrome.run('W.get().title') == 'Title typed in Firefox', 'two browsers: focusing did not load the newer story')
        chrome.run(f"W.updateChapter({json.dumps(chapter)},'Renamed in Chrome','A story')")
        settle([firefox, chrome])
        check(saved()['title'] == 'Title typed in Firefox', 'two browsers: the Firefox change was erased')
        check(saved()['levels'][0]['level']['title'] == 'Renamed in Chrome', 'two browsers: the Chrome change was lost')

        # A page that never heard about a newer save is stopped and told, instead of overwriting it.
        newer, older = Tab(url, 'firefox', 'newer'), Tab(url, 'chrome', 'older')
        newer.run("W.updateStory('Saved first','Our intro')")
        settle([newer, older])
        older.run("W.updateStory('Typed in an old copy','Our intro')")
        settle([newer, older])
        check(saved()['title'] == 'Saved first', 'stale page overwrote a newer save')
        check(older.run('FolderSave.conflict') == 'true', 'stale page was not told about the conflict')
        check('changed in another window' in older.run("elements['folder-save-status'].textContent"), 'stale page shows no explanation')
        older.run("var flushed='waiting';FolderSave.flush().then(()=>flushed='ok',e=>flushed='refused')")
        settle([older])
        check(older.run('flushed') == 'refused', 'leaving a page with an unsaved conflict should be stopped')
    finally:
        server.shutdown()
        server.server_close()
        temp.cleanup()
    print('Two-tab and two-browser folder saves keep both changes; stale saves are refused with a message')


if __name__ == '__main__':
    try:
        main()
    except AssertionError as failure:
        print('FAILED:', failure)
        raise SystemExit(1)
