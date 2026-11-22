# Drone game — performance notes (2026-11-21)

## What was measured
Chrome on this desktop, which has no graphics card, so every pixel is painted by the processor. That makes it a
worst case: on a normal computer Chrome paints the canvas on the graphics card and all of the numbers below shrink a lot.
Window 1920 x 1080. "Frame time" is the whole frame as the browser sees it; "game code" is only the JavaScript in the page.

| situation | before | after |
|---|---|---|
| start, screen still dark | 47 ms/frame (21 fps) | 16.5 ms/frame (60 fps, the browser's cap) |
| everything lit, over the lagoon, 9 m up | 79 ms/frame (13 fps) | 28 ms/frame (35 fps) |
| game code (physics, input, issuing the drawing) | 0.1–0.2 ms | 0.04–0.1 ms |

## Where the time went
The game's own code is negligible. Nearly all the time is the browser painting full-screen layers, once per frame:
1. the whole 2000 x 2000 ground picture drawn rotated and scaled onto the screen;
2. a second 2000 x 2000 picture (the "what has been surveyed" mask) combined with the first, pixel by pixel, over the whole screen;
3. a dimming layer over everything but the live rectangle;
4. 102 grid lines and the map outline, re-drawn every frame;
5. the finished frame composited onto the page (unavoidable).
Removing the mask alone saved 22 ms; removing the mask, the ground and the grid left 23 ms — i.e. the screen-sized passes are the cost, not any one clever thing.

## What was changed
- One "seen" picture of the map now holds the ground surveyed so far, already dimmed. Each frame draws that picture once,
  plus the bright live rectangle (a small clipped copy). The mask pass and the dimming pass are gone.
- Grid lines, the map outline and the helipad are painted into the ground picture once at load instead of every frame.
- The screen canvas is opaque (no transparency to blend with the page) and "desynchronized" (lower input-to-screen latency).
- Nothing changed in how the game looks or plays.

## Later finding (2026-11-21 evening): the grass speckle
A fine speckle blended over the ground near the camera cost 32 ms a frame at 1080p in software (63 ms with it, 31 ms without) — it was a
second full-screen pass with a blend mode. Removed. The "seen" picture went from 8 to 12 px per metre (16 made the high-altitude view
slower again: 39 ms against 26). The charging station is now drawn as shapes every frame instead of pixels in the ground picture, which costs
nothing measurable and is sharp at any zoom.

## Later finding (2026-11-21 night): the sketched map, and "8-bit" pixels
The person's sketched map (houses, sheds, greenhouse, tank, shelter, roads, fields, trees) is painted into the one ground picture at load,
so it costs nothing per frame. Image smoothing is now off: close-ups show crisp big pixels instead of blur, and the frame got cheaper too
(software, 1080p: about 27 ms → 17–19 ms at every height). The 11 animals are the only moving sprites (tiny 8 px/m bitmaps, drawn only
under the live rectangle). Buildings and trees also act as obstacles; roofs can be landed on. This is the setup meant for a Switch browser:
plain 2D canvas, one big image, no blend modes, no WebGL.

## Switch browser findings (2026-11-21)
- On the Switch, the page froze on the menu and the browser offered to stop a slow script. Cause: at load the game still computed the
  whole 2000 x 2000 ground picture pixel by pixel (4 million pixels) and only then laid the painted map on top, which covers all of it.
  On this desktop that took 17.6 s before the game was ready, with single blocks of up to 3.9 s. Now, when the painted map covers the
  whole L, it is used directly: ready in about 0.7 s, longest block 0.18 s. The slow path only runs if there is no full painted map.
- The Switch browser most likely runs JavaScript without a JIT compiler, so per-frame script work should stay small. It is: the frame's
  JavaScript is well under a millisecond here; the time goes into painting.
- The Switch browser does not report the right stick; turning and height moved to the shoulder buttons.
- Sound was too quiet there; it is now about 7 dB louder, with a limiter so it does not distort.

## Ground quality: the options
The ground is a 2000 x 2000 picture (8 px per metre) made once from the 0.5 m height data. Close to the drone the camera shows it
magnified 20x, so it looks soft. Ways to fix that, cheapest first:
1. **Shapes instead of pixels for man-made things** (done for the station; could be done for the map edge, grid, roads, buildings).
   Sharp at any zoom, nearly free. Does nothing for the terrain itself.
2. **A bigger ground picture.** 16 px/m means 4000 x 4000 (64 MB per copy, two copies) and slower far views; 32 px/m is out of reach. Not recommended.
3. **Tiles made on demand** (how web maps work): keep the 8 px/m picture for far views; near the drone, build 32–64 px/m tiles for just the
   few square metres in view from the height data, keep a small cache, drop old ones. Sharp colours and shore lines; the terrain data has no
   finer detail, so real texture would come from a procedural pattern (grass, pebbles) painted into the tiles — paid once per tile, not per frame.
   About a day's work, stays in plain 2D canvas.
4. **Bitmap textures** (grass, sand, water images) tiled and mixed by height, painted into the tiles of option 3. Looks the most "real"; needs
   artwork (supplied or generated).
5. **WebGL**: the graphics card draws the terrain from the height data with a small program per pixel — colour ramp, shading, procedural grass,
   water ripples, mipmaps for far views — sharp at every zoom and the fastest of all. A rewrite of the ground drawing (a few hundred lines);
   on a machine with no graphics card it falls back to software and is slow.
6. Vector terrain (contour polygons / SVG): sharp edges but cannot do smooth shading well. No.

## How to get more, if ever needed
- The frame rate is capped at the monitor's refresh rate by the browser (requestAnimationFrame); 60 fps on a 60 Hz screen is the maximum,
  144 on a 144 Hz screen. Nothing in the page can exceed that, and nothing needs to.
- Check chrome://gpu says "Canvas: Hardware accelerated". If it says software, that alone costs more than everything else combined.
- Draw only the visible part of the map picture (crop the source rectangle) — helps most when zoomed in.
- Cap the device pixel ratio at 1 on very high-resolution screens (4K, Retina) — quarter the pixels, at the cost of some crispness.
- Move the ground drawing to WebGL — the biggest possible win, but a rewrite of the drawing code; not worth it for this game.
