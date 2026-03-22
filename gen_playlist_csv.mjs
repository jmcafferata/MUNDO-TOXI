// Lee Playlist.kt y genera playlist.csv
import { readFileSync, writeFileSync } from 'fs';

const kt = readFileSync(
  './toxi-tv-android/app/src/main/java/media/toxi/tv/Playlist.kt',
  'utf8'
);

// Extraer TvItem("id", duration, "title")
const re = /TvItem\("([^"]+)",\s*([\d.]+),\s*"([^"]+)"\)/g;
const lines = ['id,duration,title,onTV'];
let m, count = 0;
while ((m = re.exec(kt)) !== null) {
  const [, id, duration, title] = m;
  const t = title.replace(/"/g, '""');
  lines.push(`${id},${duration},"${t}",true`);
  count++;
}

writeFileSync('playlist.csv', lines.join('\n'), 'utf8');
console.log(`Generado playlist.csv con ${count} videos`);

