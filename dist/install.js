// When the game is hosted on a website (not the family launcher), keep a copy of its files so it opens offline as a Home Screen app.
if('serviceWorker' in navigator&&location.protocol==='https:'&&!window.FolderBootstrap)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
