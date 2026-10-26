# Super L.E.O. Maker 3 handoff

Updated 2026-10-25. Development computer: Linux Mint.

## Project and repository

- GitHub: https://github.com/DistilleryPi/Super-L.E.O.-Maker-3 (public).
- Local main checkout: `~/Projects/jump-workshop`. Codex built the game there. Work
  happens on a branch in this checkout, or in a separate `git worktree` while another
  agent is active in it.
- Check `git status`, `git log` and `gh pr list` for current state; do not treat the
  branch or PR state below as current without checking.

## History

- `ae42117` README only. `1f610cf` the full game, built with Codex (2026-10-25).
- PR #1 merged 2026-10-25 as `e8ebea2`, from the DistilleryPi GitHub account: three save
  and World Maker fixes, plus `AGENTS.md`, `CLAUDE.md` and this handoff.
- Branch `fix/spike-hitbox` (pull request open, not merged): spikes hurt only where drawn.

## Current save behaviour

- With the launcher, pages save `world` (story, levels, map, drawing) and
  `soundSettings` into `data/game.json`; audio goes to `data/sounds/<id>.audio`.
  Each save first copies the old `game.json` to `game.previous.json`.
- `game.json` keeps a revision for `world` and for `soundSettings`. Saves send the
  revision they were edited from, and the server refuses older ones with 409. Tabs in
  one browser share saves over `BroadcastChannel`. Pages check for newer saves on focus
  or when shown again, which covers a second browser. A refused page shows a banner
  asking to reload.

## Latest work: spike hitbox (`fix/spike-hitbox`)

Spikes are drawn as a triangle (base corners 2,31 and 30,31, point 16,5 inside the 32×32
square), but any overlap with the square ended the run, so clearing the point or brushing
an empty corner was Game Over. `touchesSpike()` in `game.js` now checks the triangle,
shrunk by 3 pixels so a near miss counts as a miss. Shields still protect.

Checks on 2026-10-25: all five suites pass. The new spike checks in `test_game.py` (two
near misses over the point, near misses at each side of the base, and touches from the
left, the right and above) failed on `main` at the first near miss and pass on the
branch. The same eight cases (including a shielded touch) were run inside the real game
page in headless Firefox: on `main` all four near misses were Game Over; on the branch
they are safe and the three touches still end the run. Not played by hand. No other
gameplay changed.

The user authorized this fix and opening its pull request. Merging was not authorized.

## PR #1: saves, map markers and restore (merged)

1. Two tabs or browsers could erase each other's work: each page sent back the whole
   story it had loaded, so the last save won. Fixed with the revisions described above.
2. Default map markers repeated every 25 chapters, so chapters 26–30 sat on 1–5.
   New markers now go to the nearest open spot. Already stacked markers are not moved.
3. Restore story refused files over 2 MB, but a 50-chapter story with the largest
   drawing exports at about 2.25 MB. The limit is now 8 MB (`StoryWorld.maxBackupBytes`).

Each new check failed on the old `main` and passed with the fix, including a headless
Firefox two-tab check driven by a local Marionette script that is not in the repository.
Not tested: Chrome, Safari, Windows, macOS, microphone and speaker hardware.
`BroadcastChannel` needs Safari 15.4 or newer; without it, pages still re-check on focus
and stale saves are still refused.

## Open items from the 2026-10-25 review

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
7. Done on `fix/spike-hitbox`: spikes hurt only where the triangle is drawn.
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
- `CLAUDE.md`: imports `AGENTS.md` so Claude Code loads the same instructions.
