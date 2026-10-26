import ctypes,pathlib
j=ctypes.CDLL('libjavascriptcoregtk-4.1.so.0')
j.JSGlobalContextCreate.restype=ctypes.c_void_p
j.JSGlobalContextCreate.argtypes=[ctypes.c_void_p]
j.JSStringCreateWithUTF8CString.restype=ctypes.c_void_p
j.JSStringCreateWithUTF8CString.argtypes=[ctypes.c_char_p]
j.JSEvaluateScript.restype=ctypes.c_void_p
j.JSEvaluateScript.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_int,ctypes.POINTER(ctypes.c_void_p)]
j.JSValueToStringCopy.restype=ctypes.c_void_p
j.JSValueToStringCopy.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p]
j.JSStringGetUTF8CString.argtypes=[ctypes.c_void_p,ctypes.c_char_p,ctypes.c_size_t]
c=j.JSGlobalContextCreate(None)

root=pathlib.Path(__file__).resolve().parents[1]
code=(root/'tests/audio-stub.js').read_text()+(root/'dist/instruments.js').read_text()+(root/'dist/sound.js').read_text()+(root/'dist/sound-studio.js').read_text()+(root/'tests/audio-checks.js').read_text()
def evaluate(code):
 e=ctypes.c_void_p();s=j.JSStringCreateWithUTF8CString(code.encode());r=j.JSEvaluateScript(c,s,None,None,1,ctypes.byref(e));v=e.value or r;st=j.JSValueToStringCopy(c,v,None);buf=ctypes.create_string_buffer(4096);j.JSStringGetUTF8CString(st,buf,4096)
 if e.value: raise RuntimeError(buf.value.decode())
 return buf.value.decode()
evaluate(code)
for i in range(80): evaluate('drain()')
result=evaluate("done?(failure||'Audio recording, upload, storage, selection, looping, mute, volume, instruments and WAV tune checks passed'):'ERROR: checks did not finish'")
print(result)
raise SystemExit(0 if result.endswith('checks passed') else 1)
