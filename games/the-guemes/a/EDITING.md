# Changing the map

There are three layers, from the bottom up. Change whichever one you need.

## 1. Heights — terrain.png (greyscale, 501 x 501, one pixel per 0.5 m)
Height in metres = (pixel value − 200) / 40. Below −2 m is water. Edit it in any image editor in 8-bit greyscale, or change
`make-terrain.mjs` and run `node make-terrain.mjs` to generate a new one. `terrain.json` describes the encoding.

## 2. Objects — the lists at the top of index.html
BUILDINGS, TANK, ROADS, FIELDS, PADDOCK, TREES. Positions are metres in the map's own frame (see below); buildings have a size,
a turn in degrees and a roof height. These are painted into the ground picture when the page loads, and the game also uses them
for collisions and for landing on roofs. Edit with any text editor.

## 3. Paint — map-art.png (2000 x 2000, 8 px per metre)
Right now map-art.png is your own painted map (the whole map, opaque), so it decides how everything looks. The lists in index.html
still decide what is solid; when you remove or move a building or tree in the painting, tell me (or edit the list) so the invisible
obstacle goes too.
A picture painted in Photoshop (or any editor that saves PNG with transparency) that goes on top of everything except the map's edge.
Transparent where the generated map should show through; paint ground colour over something to hide it.
- `map-template.png` is the map as the game draws it now (currently the same as your map-art.png). Painting the whole map, as you
  did, works: save it as `map-art.png`. A layer with transparency works too.
- Save it next to index.html. Opened from a web server (the usual way here) it is picked up at once on reload. To bake it into the
  single file as well, run `node paste-assets.mjs` in this folder.
- It is pixel art by nature: 1 pixel = 12.5 cm, and the game draws it without smoothing. Paint on a large pixel grid rather than
  with soft brushes.
- Painted things are only paint: the game does not know a painted building is solid. For solid things, add them to BUILDINGS or TREES too.

(The game uses a 256-colour copy of your painting to keep the page small — 66 KB instead of 713 KB, with no visible difference. Your
full-colour original is kept as `map-art-original.png`. If you paint a new map-art.png, I can make the small copy again, or run
`node paste-assets.mjs` as it is — it just makes the page bigger.)

## The map's frame
The pictures are in the map's own frame, not north-up:
- the top-left corner of the picture is the east corner of the map, where the charging station is;
- the bottom edge is the north-west long side (the Güemes road), the left edge is the other long side;
- the top-right quarter of the picture is outside the L and is not shown;
- 8 px per metre in map-art.png / map-template.png, 2 px per metre in terrain.png;
- the lagoon is centred at 125 m, 220 m → pixel (1000, 1760) in the 2000 px pictures.
