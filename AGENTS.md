# Working on Super L.E.O. Maker 3

Read `docs/HANDOFF.md` before changing code. It records the shared development state,
open pull requests, checks performed and next priorities. Chat history and ignored local
files are not shared state. Update the handoff when completing work.

## Project

- A family platformer (Elley-Oh!), level builder, World Maker and sound studio. The game
  is plain HTML/CSS/JavaScript in `dist/` with no build step. `start_game.py` is a
  standard-library Python 3 server on 127.0.0.1 that saves into `data/`.
- Keep it dependency-free: no npm, bundlers, frameworks or Python packages without
  approval. Launchers must keep working on Linux, macOS and Windows.
- Browser-only mode (opening `dist/index.html` directly) must keep working through
  localStorage, sessionStorage and IndexedDB.

## Family data and privacy

- `data/` holds the family's story, photos of drawings and voice recordings. It is
  git-ignored and the repository is public. Never commit, upload or print its contents.
- Tests use temporary data folders (`GameServer(address, data_dir)` or `--data-dir`),
  never the real `data/` folder.
- Preserve save compatibility. `game.json` is version 1; saves without `revisions` must
  still load. Browser keys `jumpWorkshop`, `jumpWorkshopDraft`, `jumpWorkshopWorld`,
  `jumpWorkshopSound` and the `jumpWorkshopAudio` database are migration sources; do
  not rename them.
- Keep the launcher on loopback with its Host, Origin and `X-Game-Save` checks, and keep
  the revision check that refuses saves made from an older copy (HTTP 409).

## Git collaboration

- Codex and Claude both work on this repository. Inspect branch, working-tree status and
  fetched remote state before starting. Preserve local or unpublished changes; never
  discard or overwrite another session's work.
- One writing agent per folder at a time. Concurrent work uses its own branch, ideally in
  a separate `git worktree`. Do not force-push or resolve conflicts by taking one side.
- `main` is the shared baseline. Changes go through a branch and pull request. Commit,
  push, open PRs and merge only when the user authorizes it; one does not imply the next.
- Global git has no author identity. Use the author shown on existing commits
  (`git log -1 --format='%an <%ae>'`) with `git -c user.name=... -c user.email=...`.

## Validation

Run on Linux with `libjavascriptcoregtk-4.1` installed (the JS suites run the real
`dist/` scripts in JavaScriptCore):

```sh
python3 -B tests/test_world.py
python3 -B tests/test_game.py
python3 -B tests/test_audio.py
python3 -B tests/test_folder_sync.py
python3 -B -m unittest discover -s tests -p test_folder_server.py -v
```

- Each JS suite prints one pass line and exits non-zero on failure.
- No automated test loads `map.js`, `world-maker.js` or the HTML pages. Check changes
  there in a real browser; headless Firefox is installed.
- Add a regression test for every bug fix and confirm it fails before the fix.
- Run `git diff --check` before committing. Documentation-only changes do not need the
  full suite. Record exactly which checks passed and what was not tested (other
  browsers or operating systems, microphone and speaker hardware).

## Code notes

- `dist/*.js` are hand-written but packed onto long lines. Match the surrounding style
  until a deliberate reformat, and never mix a reformat with behaviour changes.
- Save path: `folder-store.js` (launcher queue, revisions, cross-tab sync) feeds
  `world.js` (`StoryWorld`; `commit(change)` reapplies each change to the newest copy).
  Pages redraw on the `storychange`, `folderchange` and `worldchange` events.
