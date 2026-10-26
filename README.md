# Super L.E.O. Maker 3

Featuring Elley-Oh!, Jump Workshop, and World Maker.

A family platformer, level editor, world-map builder, and sound studio. The browser game uses plain HTML/CSS/JavaScript; the local launcher needs Python 3 and has no third-party dependencies.

## Start the game

Use a launcher from this folder:

- Linux: run `./start-game.sh`.
- macOS: open `Start Game.command` (Python 3 must be installed).
- Windows: open `Start Game.bat` (Python 3 and its `py` launcher must be installed).
- Any platform with Python: run `python3 start_game.py` (or `py -3 start_game.py` on Windows).

The launcher opens **http://127.0.0.1:8767/map.html**. Keep its terminal window open while playing. Ctrl+C stops it. If an older server already occupies that port, stop the older server first. Use `python3 start_game.py --port 8769` to choose another port.

Opening `dist/index.html` directly still works as a browser-only game, but cannot save into the game folder. The Python launcher provides folder saving and microphone recording through localhost. The server listens only on this computer.

## Where saves live

With the launcher, the game saves next to its source:

```text
data/
  game.json             story, levels, World Maker layout/drawing, progress, sound choices
  game.previous.json    previous JSON save, for recovery
  sounds/
    <clip-id>.audio      uploaded, recorded, or instrument-generated sound files
```

Sound names and formats are recorded in `game.json`; the `.audio` filenames are internal storage names. Download from Sound setup to obtain WAV, MP3, or WebM files with ordinary extensions. Writes replace files atomically. The save-status banner reports pending writes and failures; wait for **Saved in game folder** before closing or copying the folder. Keep a separate backup of the complete `data` folder; the previous JSON save is not a backup of deleted audio files.

When the game folder has no story yet, the launcher version adopts the existing world, single-course save, or tab draft from the same browser and address. Existing browser sound files migrate when a game, World Maker, or Sound setup page opens. Browser copies are retained as fallbacks. After migration, folder data takes precedence, including in a different browser. An existing populated game folder is not overwritten by an unrelated browser save.

Browser-only mode stores story data in localStorage (`jumpWorkshopWorld`), tab drafts in sessionStorage (`jumpWorkshopDraft`), and audio in IndexedDB (`jumpWorkshopAudio`). Different browsers and addresses have separate browser storage. Opening the original address is necessary to migrate older saves; `localhost`, `127.0.0.1`, and direct-file pages do not share browser storage.

## Share the game

Stop the launcher after the save-status banner is clear. Zip **this whole folder**, including `start_game.py`, `dist`, the launchers, and `data`. Your friend unzips it and runs the launcher with Python 3. Their copy includes your chapters, map drawing, sounds, and current completion stars. To start fresh progress, use Clear completion stars in World Maker.

Export whole story and Restore story remain available in World Maker. A story JSON backup includes the map and its reference drawing, but not audio files. Single-course Export/Import also remains available. Download sounds separately when sharing JSON exports rather than the whole folder.

## Build and play levels

Select tiles and click or drag to paint. Right-click erases; Undo reverses strokes. The slider scrolls a 60 × 16 block course. Place the start and the Pink castle finish above a floor. Course edits save automatically as chapters. Play opens the chapter’s story, then Begin adventure starts the run.

Move with arrows or A/D, jump with Space, W, or Up, and hold Shift or Sprint for higher, farther jumps. Small Elley-Oh! bumps bricks and knocks out hidden rewards once. Empty blocks stay solid. Milk makes him visibly taller; Big Elley-Oh! breaks bricks and releases rewards. Growth waits for room under low ceilings. Milk glasses move, turn at walls, and fall from edges. Side contact with an enemy shrinks a big player, with 1.5 seconds of grace to escape. A small player hit by an enemy, unshielded spike contact, or a fall shows Game Over and plays the chosen sound. Try again restarts the chapter.

Treats add to a treat counter. Shields last 10 seconds and protect against enemies/spikes. Jump boosts last 12 seconds. Collecting another refreshes its timer. Restart restores hidden items and resets size and powers. Reaching the pink house door completes the chapter and offers connected next chapters.

## World Maker

Open **World Maker**, then **Build your world**:

- Drag level markers to match your imagined geography. With Move selected, arrow keys also move a focused level marker; Shift makes larger steps.
- Choose Connect levels, click the starting chapter, then click its destination. Arrows indicate story direction. Multiple outgoing connections create a choice after finishing that chapter.
- Place trees, mountains, water, flowers, houses, or road pieces. Move also drags scenery. Erase removes scenery and paths; it does not delete levels.
- Use Undo to reverse map edits. Clear scenery keeps the levels, paths, and drawing.
- **Use your drawing** imports a JPG, PNG, or WebP photo (up to 12 MB). It is resized and stored with your world as a background guide. Remove drawing removes the guide without changing level positions.
- Done building returns to play mode; click a level marker to play its chapter.

The chapter list below edits level names, pre-level story text, and chapter order. Add blank level creates a chapter and map marker; Import level adds an exported course. Up to 50 chapters fit in a story. Default paths follow chapter order until you customize connections. Reordering chapters then keeps your custom paths. Deleting a chapter removes its map marker and attached paths. Layout edits to a course clear its completion star.

## Sound studio

Use Sound setup to record a microphone, upload audio, or play the piano/xylophone. Start recording asks for microphone permission. Stop & save finishes; recordings stop automatically at two minutes. Uploads may be up to 20 MB. Leaving the visible studio stops recording and releases the microphone.

Piano and xylophone keys are clickable or playable using A W S E D F T G Y H U J K (C4–C5). Record tune captures up to one minute or 256 notes without using the microphone. Stop & save tune generates a WAV file in your sound library; switch instruments during the tune to mix them. Discard clears a take.

Assign library clips to background music and individual effects. Music loops during play. Built-in and Silent options are available. Choices and volume save automatically; Stop preview ends playback. Browser sound formats vary; WAV or MP3 uploads are good alternatives if a recording cannot play.

## Source and verification

- `start_game.py`: localhost server, atomic folder saves, audio storage.
- `dist/game.js`: course editor, physics, character/castle drawings.
- `dist/world.js`: chapter library, story graph, and map data.
- `dist/world-maker.js`: draggable map editor and photo guide.
- `dist/sound.js`, `sound-studio.js`, `instruments.js`: audio library and instruments.
- `dist/folder-store.js`: folder-save queue and browser fallback.

Run `python3 tests/test_world.py`, `python3 tests/test_game.py`, and `python3 tests/test_audio.py` on Linux with JavaScriptCore installed. Run `python3 -B -m unittest discover -s tests -p test_folder_server.py -v` for isolated localhost server tests.

Checks cover gameplay, milk movement, growing/shrinking, story/map validation and branching, JSON/audio persistence, atomic backups, and rejected cross-origin writes. Firefox checks cover real dragging/keyboard map movement, drawing upload, branch choices, instrument WAV generation, folder migration, and loading after browser storage is cleared. Microphone capture is tested with a fake microphone; actual microphone and speaker hardware still need a check on your computer.
