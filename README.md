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

The game can be open in several tabs or browsers at once. Tabs in the same browser pass each save to one another immediately, and a page that was in the background checks for newer saves when you return to it. `game.json` keeps a revision number for the story and for sound choices; if a page still tries to save from an older copy, the launcher refuses it and the banner asks you to reload, so newer work is never overwritten.

When the game folder has no story yet, the launcher version adopts the existing world, single-course save, or tab draft from the same browser and address. Existing browser sound files migrate when a game, World Maker, or Sound setup page opens. Browser copies are retained as fallbacks. After migration, folder data takes precedence, including in a different browser. An existing populated game folder is not overwritten by an unrelated browser save.

Browser-only mode stores story data in localStorage (`jumpWorkshopWorld`), tab drafts in sessionStorage (`jumpWorkshopDraft`), and audio in IndexedDB (`jumpWorkshopAudio`). Different browsers and addresses have separate browser storage. Opening the original address is necessary to migrate older saves; `localhost`, `127.0.0.1`, and direct-file pages do not share browser storage.

## Share the game

Stop the launcher after the save-status banner is clear. Zip **this whole folder**, including `start_game.py`, `dist`, the launchers, and `data`. Your friend unzips it and runs the launcher with Python 3. Their copy includes your chapters, map drawing, sounds, and current completion stars. To start fresh progress, use Clear completion stars in World Maker.

Export whole story and Restore story remain available in World Maker. A story JSON backup includes the map and its reference drawing, but not audio files. Single-course Export/Import also remains available. Download sounds separately when sharing JSON exports rather than the whole folder.

## Build and play levels

Select tiles and click or drag to paint. Right-click erases; Undo reverses strokes. New courses are 720 × 16 blocks, twelve times the original length. The slider and its arrow buttons scroll the course in sections. Older 60-tile courses keep their layout; **Make 12× longer** keeps their blocks, fills the new 660 tiles with a mix of gaps, surprise blocks, pipes and snappers, stairs, turtles, raccoons, switch bridges, floating platforms, spikes and critter packs (fish in underwater chapters), and moves the finish to the new end. The same course always gets the same mix, and Undo reverses it. Place the start and finish above a floor. Course edits save automatically as chapters. Play opens the chapter’s story and lets you choose an era before Begin adventure starts the run.

Move with arrows or A/D, jump with Space, W, or Up, and hold Shift or Sprint for higher, farther jumps. Small Elley-Oh! bumps bricks and knocks out hidden rewards once. Empty blocks stay solid. Milk makes him visibly taller; Big Elley-Oh! breaks bricks and releases rewards. Growth waits for room under low ceilings. Milk glasses move, turn at walls, and fall from edges. Side contact with an enemy shrinks a big player, with 1.5 seconds of grace to escape. A small player hit by an enemy, unshielded spike contact, or a fall shows Game Over and plays the chosen sound. Try again restarts the chapter.

Treats add to a treat counter. Shields last 10 seconds and protect against enemies/spikes. Jump boosts last 12 seconds. Collecting another refreshes its timer. Restart restores hidden items and resets size and powers. At the end of a linked chapter, jump onto the exit pipe and press ↓ (S, or the ▼ touch button) to slide down it; Elley-Oh! falls out of a sky pipe in the next chapter. A chapter with multiple map exits shows the route choices after the slide. The final chapter ends at the pink house. Walking through its door goes inside to a one-screen boss room in the chapter's style (built by the game, never saved as a chapter). The Crocodile Boss paces the floor, turns to face Elley-Oh!, opens its jaws as a warning and burps a flame along the floor; jump over it. It burps sooner after each hit, and on its last hit point it burps a second, higher flame as well. Stomp it or use powers three times; its flames go out when it is beaten. A milk block and a fire bloom block near the entrance help. Defeating it opens the gate, and Queen Mom walks over and thanks Elley-Oh!. Dying inside restarts the room; Play again restarts the whole chapter. The story then starts over at Chapter 1 the next time the game opens, and the finish sign offers **Start over at Chapter 1**.

The toolbox groups Terrain, Surprise blocks, Critters and Other tools. A pipe click draws two columns down to the next solid block or floor; the last column can make a narrow pipe. Put a snapper plant above a pipe for a timed hide, rise, bite and sink cycle, or place one on open ground. Shell turtles walk until stomped into shells. Touch a still shell to kick it; stomp a moving shell to stop it. Round fish swim horizontally, and only a ground-level stomp defeats them. **ON/OFF switches** (Switches group) flip every red and blue block in the chapter: red blocks are solid while the switch shows ON, blue blocks while it shows OFF, and the inactive colour is a dashed outline Elley-Oh! and critters pass through. Bump a switch from below, spin into it with the striped tail, or hit it with a kicked shell, fire or ice. Each run starts ON; anyone inside a block that turns solid is lifted on top. Raccoons stay put, face Elley-Oh! and throw rocks at him in an arc. A rock hurts on contact (a shield brushes it away) and breaks when it hits a block. Stomps, shells, shields and powers defeat raccoons. A kicked shell, shield, fire, ice or striped tail spin can clear critters.

The **Theme** picker makes a chapter a sunny ground or underwater course. Underwater chapters have slower movement and falling, and every fresh jump press makes a swim stroke. Each of the four game styles has its own underwater background and sand or coral ground. The built-in underwater music is an original slower tune played with that style's sound voice. Older chapters remain ground courses.

Back up the full `data` folder before opening a story with new tiles or 720-tile chapters on an older copy of the game: older versions cannot validate them.

Fire bloom, frost bloom and striped tail surprise blocks hide a still power item. A small Elley-Oh! grows when he picks one up; if a ceiling blocks him, growth waits for open space. A hit removes a power while he stays big; the next hit shrinks him, and a hit when small ends the run. Tap Shift, X or F to use a power. Holding Shift still sprints, and the on-screen Sprint / power button does both. Fire throws bouncing sparks (up to two); frost freezes critters into temporary solid blocks; the striped tail spins into nearby critters and blocks. Hold jump while falling to float in the tail suit. Sprint on the ground for about a second, then jump to fly for about four seconds; further jump presses lift him during flight.

### Players, levels and newer items

Choose who plays with **Player** (above the course, before a chapter, or in the pause menu): Elley-Oh! the electrician, Princess Blyth, King Dadderoons or Queen Mom. All four play the same way and change outfit with each power. Queen Mom waits in the pink castle, unless Queen Mom is playing; then King Dadderoons waits there. **Level** picks Easy (the classic rules) or Difficult: a critter that touches a glass of milk drinks it and grows big, and a big critter takes two hits or bonks (the first shrinks it); critters also walk faster and raccoons throw more often. Both choices are remembered on each device.

The Surprise blocks group also has a **sword block** (tap Sprint / power to swing the sword at critters, rocks, flames and blocks), a **bed box** (bump it, or hit it with the sword or tail, and every critter on screen sleeps for 8 seconds; sleeping critters cannot hurt you and a bonk still defeats them) and a **buried Daddo burger** (a dig spot in the ground: stand on it and press ↓ to dig the burger up; sprint a short way, jump, then keep tapping jump to fly for about five seconds). Make 12× longer can add sword blocks, bed boxes and dig spots too.

On a touch screen, Play mode fills the screen. ◀ ▶ and Sprint / Jump are joined pads: a finger presses every button it is on and can slide between them, so one thumb resting on the line between Sprint and Jump presses both.

## Game styles

Like a course maker's style switch, each chapter can be drawn in one of four looks: **8-bit** (1985-style chunky pixels and a plain blue sky), **8-bit deluxe** (1988-style black outlines and bolted background blocks), **16-bit** (1990-style shaded sprites, grassy ground and hills with eyes) and **Modern** (smooth shapes and layered hills). Pick one under Game style above the course, on the chapter introduction, or while paused. Press Esc or P, or use the Pause button, to pause; the menu also offers Resume, Restart, Back to builder and World Maker. Elley-Oh!, blocks, critters, coins, items, the pipes, the Crumb Keeper, the pink home, the score bar, the toolbox pictures and the built-in music all change; the course and its gameplay stay the same in each style. The style is saved with the chapter. Chapters made before styles existed use 8-bit. All art and tunes are original, drawn and written in code; they borrow each era's general feel, not any other game's sprites or music.

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

Assign library clips to background music and individual effects, including swim strokes, throwing, freezing, tail spins and shell kicks. Music loops during play. Built-in and Silent options are available. Choices and volume save automatically; Stop preview ends playback. Browser sound formats vary; WAV or MP3 uploads are good alternatives if a recording cannot play.

## Source and verification

- `start_game.py`: localhost server, atomic folder saves, audio storage.
- `dist/game.js`: course editor, physics, style picker.
- `dist/styles.js`: the four game styles (pixel sprites, scenery, score bars, the pink home).
- `dist/world.js`: chapter library, story graph, and map data.
- `dist/world-maker.js`: draggable map editor and photo guide.
- `dist/sound.js`, `sound-studio.js`, `instruments.js`: audio library, instruments and each style's built-in music.
- `dist/folder-store.js`: folder-save queue and browser fallback.

Run `python3 tests/test_world.py`, `python3 tests/test_game.py`, `python3 tests/test_audio.py`, and `python3 -B tests/test_folder_sync.py` on Linux with JavaScriptCore installed. Run `python3 -B -m unittest discover -s tests -p test_folder_server.py -v` for isolated localhost server tests.

Checks cover gameplay, all four game styles and both themes, pipe placement, snapper timing, shells, fish, swim strokes, new powers, frozen blocks, walking and jumping poses, milk movement, growing/shrinking, story/map validation and branching, JSON/audio persistence, multi-window saves, and rejected cross-origin writes. Headless Firefox checks cover save, reload and play in all eight style/theme combinations, direct-file browser mode and a 390-pixel layout; screenshots of all eight combinations were reviewed. Microphone capture uses a fake microphone. Chrome, Safari, Windows, macOS, real touch input and speaker hardware have not been checked for this feature.
