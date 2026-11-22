// Pastes the picture files into index.html so the game stays a single file you can copy anywhere:
//   terrain.png  -> between the TERRAIN markers   (heights; see terrain.json)
//   kury.jpg     -> between the KURY markers      (the boss's portrait)
//   map-art.png  -> between the ART markers       (optional hand-painted layer; if the file is missing the markers are emptied)
// Run with:  node paste-assets.mjs      (in this folder)
// When the game is opened from a web server, map-art.png is also picked up directly, without running this.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
let html = readFileSync("index.html", "utf8");
const paste = (tag, file, mime) => {
  const a = html.indexOf("/*" + tag + "*/"), b = html.indexOf("/*END-" + tag + "*/");
  if (a < 0 || b < 0) throw new Error(tag + " markers not found in index.html");
  const data = existsSync(file) ? '"data:' + mime + ';base64,' + readFileSync(file).toString("base64") + '"' : '""';
  html = html.slice(0, a) + "/*" + tag + "*/" + data + html.slice(b);
  console.log((existsSync(file) ? "pasted " : "no file, cleared ") + file);
};
paste("TERRAIN", "terrain.png", "image/png");
paste("KURY", "kury.jpg", "image/jpeg");
paste("ART", "map-art.png", "image/png");
writeFileSync("index.html", html);
