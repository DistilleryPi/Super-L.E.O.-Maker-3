# Super L.E.O. Maker 3 handoff

Updated 2026-10-27. Development computer: Linux Mint.

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
- PR #2 merged 2026-10-25 as `9918ca2`: spikes hurt only where drawn. The merged branches
  `fix/two-tab-saves-map-restore` and `fix/spike-hitbox` still exist on GitHub.
- PR #3, `feature/game-styles` (worktree `~/Projects/jump-workshop-styles`), is open and
  not merged. It adds four game styles; its checked head was `823e2db`.
- `feature/critters-and-powers` is a separate worktree at
  `~/Projects/jump-workshop-powers`, branched from `feature/game-styles` at `823e2db`.
  The user authorized committing and pushing this branch on 2026-10-27. Opening a PR
  and merging are separate actions and have not been authorized.

## Current save behaviour

- With the launcher, pages save `world` (story, levels, map, drawing) and
  `soundSettings` into `data/game.json`; audio goes to `data/sounds/<id>.audio`.
  Each save first copies the old `game.json` to `game.previous.json`.
- `game.json` keeps a revision for `world` and for `soundSettings`. Saves send the
  revision they were edited from, and the server refuses older ones with 409. Tabs in
  one browser share saves over `BroadcastChannel`. Pages check for newer saves on focus
  or when shown again, which covers a second browser. A refused page shows a banner
  asking to reload.

## Latest work: critters and powers (`feature/critters-and-powers`)

Claude follow-up (2026-10-27, on top of Codex's work; Codex's diff was
backed up first). From the user's play-testing:
- The family's three chapters were still 60 tiles. **Make 12× longer** (was "Extend to 720
  tiles") now fills the new columns with seeded obstacle sections (`addSections` in
  `game.js`): gaps, block rows, pipes with snappers, stairs, turtles, floating platforms,
  spikes and critter packs; fish only underwater. The last 24 columns stay clear.
- The exit pipe is solid. Stand on it and press ↓/S (new ▼ touch button) to slide down.
- Snappers centred on their pipe: `pipeUnder` pairs pipe columns from each run's left end
  (it had used column parity), and `pipeHalf` in `styles.js` draws pipes the same way.
- "Chapter 3 keeps repeating": after the final chapter the story had no way forward, and the
  game reopened the last-played chapter. Defeating the Crumb Keeper now frees Princess Mom
  (original art in all four styles): she walks out, thanks Elley-Oh! in a speech bubble with
  hearts, then the finish sign offers **Start over at Chapter 1**, and the story's selected
  chapter becomes chapter 1. A `mode=play` link is removed from the address after it starts,
  so reloading no longer restarts the chapter.
- Checks: all five suites and `git diff --check` pass; the new checks were confirmed to fail on
  Codex's version. Headless Firefox (temporary data) screenshots of an extended course, snappers,
  the exit-pipe arrow and slide, and the rescue in all four styles were reviewed; no page errors.
  The family's saved chapters were not changed: they still need **Make 12× longer** clicked.
  Codex reran all five required suites on 2026-10-27 before the authorized commit and push;
  all passed. Chrome, Safari, Windows, macOS, real touch input, microphone and speaker
  hardware, and a full hand-played 720-tile chapter remain untested.

Earlier work on this branch adds a real pause menu (button or Esc/P)
with Resume, Restart, Back to builder, World Maker and a Game era picker. The chapter
introduction also has an era picker, so players can choose before each level. Changing
the era while paused updates and saves that chapter's style; the new music begins on
resume. Movement, timers and powers stop while paused.

New and generated courses are 720 × 16 tiles (12 times the old width), with repeated
obstacle sections. Existing 60-tile saves keep their layout. **Extend to 720 tiles**
appends terrain, preserves existing blocks and moves the goal to the far end; Undo
reverses it. The camera slider now covers each course's width, and the arrow buttons
move 20 tiles per press. `validLevel` accepts uniform widths from 60 to 720. The local
server save limit is 16 MB and full-story JSON restore limit is 32 MB so many long
chapters can be saved. An older copy rejects 720-tile stories as well as new tiles.

Linked chapters now end at a drawn exit pipe. Elley-Oh! slides into it and moves
directly to the next chapter's introduction; after the player chooses an era and begins,
he falls from a sky pipe. Multiple map exits still show route choices after the slide.
The final chapter keeps the pink house. An original round biscuit golem named the
Crumb Keeper patrols nearby and takes three separate stomps or power hits; the house
door stays locked until it is defeated. Each era has original pixel or vector boss art.
New generated courses leave the final approach clear of ordinary critters.

Follow-up checks on 2026-10-26: JavaScriptCore game/world suites pass new long-course,
extension/undo, pause, saved era-change, boss, pipe navigation and sky-arrival checks. A folder-server test saves
a 50-chapter story larger than the old 4 MB limit. In isolated headless Firefox on port
8771 with temporary data, a 720-tile chapter opened, the era changed at its intro and
in pause, the pipe slide navigated to the next chapter, sky-pipe arrival began, and the
final house stayed locked until the boss's third hit; no page exception was recorded.
Direct-file browser-only mode opened a new 720-tile course and used the intro/pause
controls. An actual 390 px Firefox viewport had document width 378 px; its pause menu
was visually checked. Portal and boss screenshots were reviewed, including boss art in
all four eras and both themes. All five `AGENTS.md` suites and `git diff --check` pass.
The local playable server was restarted on port 8770 with this code and responded 200;
its existing `data/` folder was retained. Headless Firefox logged occasional slow-script
warnings while drawing; ordinary hardware performance remains unmeasured. Not tested:
full hand play of a 720-tile chapter,
Chrome, Safari, Windows, macOS, a real touch screen, or actual audio hardware.

The course builder now has grouped Terrain, Surprise blocks, Critters and Other tools.
`pipe` draws two solid columns down to the next solid tile or floor, with a rim at each
run's top and a narrow single column at the right edge. `plant`, `turtle` and `fish` are
play-time entities: a pipe-mounted snapper hides, rises, bites and sinks, and stays
hidden near the player; a stomped four-legged turtle becomes a kickable shell that
eventually wakes; round fish swim and can only be stomped outside water. Moving shells,
shields and the new powers defeat critters. The spike triangle hitbox remains unchanged.

Each level can set `theme: 'underwater'`; no theme means ground for old saves. Water
slows movement and falling and allows a swim stroke on each jump press. All four
styles draw underwater scenery and sand/coral ground; `GameSound.theme(style, theme)`
selects an original slower underwater tune in that style's voice. The new surprise
blocks release stationary fire and frost blooms or a striped tail suit. A power grows
a small player using the existing low-ceiling wait, then takes the first hit while he
stays big. Fire throws bouncing sparks, frost freezes critters into temporary solid
blocks, and the striped tail spins, floats and flies after a ground sprint. Shift on
press, X/F and the on-screen sprint button activate the power; held Shift still sprints.
All new art uses original pixel grids and per-style palettes or original modern vector
shapes. New event slots for throw, kick, swim, spin and freeze keep custom audio choices.

`dist/world.js` accepts the new tiles and theme without changing `game.json` version 1.
Changing the physics theme clears a completion star; changing only game style does not.
**Older copies of the game reject stories containing the new tiles.** Back up the full
`data` folder before opening such a story in an older copy. They can still read a story
whose only new field is `theme`, but will ignore its water physics.

Checks on 2026-10-26: all five suites in `AGENTS.md` pass, including new JavaScriptCore
checks for pipes, the snapper cycle, shell rebound/falls/kicks, fish, underwater movement, each power,
low-ceiling growth, frozen block solidity and shattering, damage, all new art in each
style and theme, new audio event overrides, and new tiles/themes saving and reloading.
`git diff --check` passes. In isolated headless Firefox on port 8770 with temporary
`data/`, all eight style/theme combinations saved, reloaded, rendered, and entered play
with no page error. Eight canvas screenshots were captured in
`/tmp/leo-powers-screens/` and visually reviewed. A separate Firefox BiDi context at
390 px had document width 378 px (no sideways scroll). Direct-file browser-only mode
opened and retained a changed style and underwater theme after reload. Headless Firefox
logged occasional slow-script timeout warnings while drawing screenshots; no page
exception was observed. Rendering speed on typical hardware remains unmeasured. Not tested:
Chrome, Safari, Windows, macOS, a real touch screen, actual microphone and speaker
hardware, or a hand-played full course. The server on port 8768 belongs to the styles
worktree and was left untouched.

## Previous work: game styles (`feature/game-styles`)

The user's son asked for the game to be more like a course maker with era styles and a
look closer to the original platformers. Each chapter now has a game style, chosen under
**Game style** above the course: `classic` (8-bit, 1985), `adventure` (8-bit deluxe,
1988), `world` (16-bit, 1990) and `modern` (HD). It is stored as `level.style`; levels
without it (all saves made before) draw as `classic`. `validLevel` is unchanged, so
older copies of the game ignore the field.

- `dist/styles.js` (new, `window.GameStyles`): all drawing. Pixel styles share sprite
  shapes written as letter grids (16 × 16 per block, drawn at 2 screen pixels per sprite
  pixel), with each style's palette, optional automatic black outline, its own bricks,
  ground (with grass or lip tops that join neighbouring ground), scenery and score bar.
  `modern` is vector drawing and keeps the original pink home. The pink home, caramel chip
  critters, milk, treats, shields and jump wings are redrawn per style. All art and
  tunes are original; the repository is public, so never copy sprites or music from
  other games.
- `dist/game.js`: the style picker, toolbox pictures drawn in the current style, an
  in-canvas score bar, walking/jumping poses and facing (`player.face`, `player.anim`,
  `heroPose()`), and stomped critters that stay squashed for 30 frames (`e.flat`). The
  old drawing functions (`tile`, `character`, `rewardIcon`, `pinkCastle`) remain as thin
  wrappers because the tests call them. Gameplay, hitboxes and physics are unchanged.
- `dist/sound.js`: `GameSound.theme(id)` picks each style's built-in music (melody and
  bass) and effect voice: pulse waves for the 8-bit styles, vibrato and echo for 16-bit
  and modern. Without a theme (sound studio) the original tune plays. Custom recordings
  still override the built-in sounds.

Checks on 2026-10-26: all five suites pass, with new checks for every style drawing build
and play mode, style undo, the play-mode lock, unknown styles, walking and jumping
poses, squashed critters, the style surviving save and reload (`test_world.py`), and
each style's music (`audio-checks.js`). In headless Firefox, with a local Marionette
script not in the repository: the style saves to `data/game.json` and survives a reload;
music and effects start without errors in all four styles; two seconds of play in each
style draw without errors; the page has no sideways scroll at 390 pixels wide; opening
`dist/index.html` directly works and keeps the style in browser storage. Screenshots of
every style were reviewed. Not tested: listening to the music on speakers, Chrome,
Safari, Windows, macOS, real touch screens.

The user authorized committing this branch and opening its pull request. Merging was not authorized.

## Previous work: spike hitbox (PR #2, merged)

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

The user authorized the fix, its pull request and then the merge.

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
7. Done in PR #2: spikes hurt only where the triangle is drawn.
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

Ideas for game styles (not started):

16. Style moves, as in course makers: a spin jump in 16-bit, a wall jump in modern.
17. Course themes within a style: underground, castle, night or underwater skies and blocks.
18. A visible mystery block (`?`) as well as the hidden-item bricks; needs a new tile
    type in `world.js` (`tiles`) and `game.js`.
19. Give the page around the course a brighter maker look and the game's real name
    (see item 14). The sound studio still previews only the original tune.

## Supporting documents

- `README.md`: running, saving, sharing, features and test commands.
- `AGENTS.md`: standing development and collaboration instructions.
- `CLAUDE.md`: imports `AGENTS.md` so Claude Code loads the same instructions.
