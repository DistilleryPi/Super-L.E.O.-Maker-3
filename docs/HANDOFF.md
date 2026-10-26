# Super L.E.O. Maker 3 handoff

Updated 2026-10-25. Development computer: Linux Mint.

## Project and repository

- GitHub: https://github.com/DistilleryPi/Super-L.E.O.-Maker-3 (public).
- Local main checkout: `~/Projects/jump-workshop`, used by Codex for the initial build.
- PR #1 branch `fix/two-tab-saves-map-restore` is checked out as a worktree at
  `~/Projects/jump-workshop-fixes`. After merging, `git pull` in the main checkout and
  remove the worktree with `git worktree remove ../jump-workshop-fixes`.
- Check `git status`, `git log` and `gh pr list` for current state; do not treat the
  branch or PR state below as current without checking.

## History

- `ae42117` README only. `1f610cf` the full game, built with Codex (2026-10-25).
- PR #1 (open, not merged): fixes three bugs from a code review on 2026-10-25. It also
  adds this handoff and `AGENTS.md`.

## Current save behaviour

- With the launcher, pages save `world` (story, levels, map, drawing) and
  `soundSettings` into `data/game.json`; audio goes to `data/sounds/<id>.audio`.
  Each save first copies the old `game.json` to `game.previous.json`.
- With PR #1, `game.json` keeps a revision for `world` and for `soundSettings`. Saves
  send the revision they were edited from, and the server refuses older ones with 409.
  Tabs in one browser share saves over `BroadcastChannel`. Pages check for newer saves
  on focus or when shown again, which covers a second browser. A refused page shows a
  banner asking to reload.

## Latest work and validation (PR #1)

1. Two tabs or browsers could erase each other's work: each page sent back the whole
   story it had loaded, so the last save won. Reproduced in headless Firefox (World
   Maker title lost after a builder tab saved). Fixed as described above.
2. Default map markers repeated every 25 chapters, so chapters 26–30 sat on 1–5.
   New markers now go to the nearest open spot. Already stacked markers are not moved.
3. Restore story refused files over 2 MB, but a 50-chapter story with the largest
   drawing exports at about 2.25 MB. The limit is now 8 MB (`StoryWorld.maxBackupBytes`).

Checks on 2026-10-25: all five suites pass. The new `tests/test_folder_sync.py`, the new
server revision tests and the marker and backup-size checks in `test_world.py` each fail
on `main` and pass on the branch. A headless Firefox two-tab check, driven by a local
Marionette script that is not in the repository, failed on `main` and passed on the
branch. Not tested: Chrome, Safari, Windows, macOS, microphone and speaker hardware.
`BroadcastChannel` needs Safari 15.4 or newer; without it, pages still re-check on focus
and stale saves are still refused.

The user authorized committing, pushing the branch, opening PR #1 and adding these two
files to it. Merging was not authorized.

## Open items from the 2026-10-25 review (not started)

Smaller bugs:

1. `game.previous.json` is overwritten on every autosave, so it usually matches
   `game.json`. Consider dated backups (for example one per launch, keep the last few).
2. Recorded tunes start with silence until the first note: `instruments.js` times notes
   from pressing Record. Trim to the first note.
3. Fast drags in the level builder skip squares: `paint()` in `game.js` marks only the
   square under each pointer event. Fill the line between squares.
4. `'use strict'` is inactive in `game.js` and `map.js` because `goTo` is defined above it.
5. The README describes Firefox checks that are not in `tests/`.

Gameplay for young players:

6. Jump forgiveness: allow a jump a few frames after leaving a ledge (coyote time) and
   remember a jump pressed just before landing (jump buffer).
7. Spikes kill on the whole 32×32 square although they are drawn as a triangle.
8. Before Play, warn if the start or castle is inside a block or has no floor.
9. Custom sound effects create a new `Audio` element per effect (noticeable lag), and a
   long recording assigned to an effect plays in full each time. Decode once with Web
   Audio and cap or restart effects.

Repository and sharing:

10. Reformat `dist/*.js` (39 lines over 400 characters) in its own commit.
11. `Start Game.bat` only runs `py`, which Python from the Microsoft Store lacks. Fall
    back to `python`.
12. Store the map drawing as its own file, like sounds. Each save currently sends the
    whole drawing (up to 1.5 MB) inline in `game.json`.
13. Sound pages download every clip on each page load. Consider loading only the clips
    that are assigned.
14. Naming: pages say "Jump Workshop" and "Elley-Oh! World Maker", never "Super L.E.O.
    Maker 3". The help dialog still says chapters save "in this browser".
15. The public repository has no LICENSE file; that choice is the user's.

## Supporting documents

- `README.md`: running, saving, sharing, features and test commands.
- `AGENTS.md`: standing development and collaboration instructions.
