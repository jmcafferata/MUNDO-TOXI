# MUNDO TOXI - Sitemap

> Generated on 2026-08-13

## Table of Contents
- [Main Pages](#main-pages)
- [Entertainment & Content](#entertainment--content)
- [Themed Experiences](#themed-experiences)
- [Events & Special Pages](#events--special-pages)
- [Miscellaneous Pages](#miscellaneous-pages)
- [Legal](#legal)
- [Directory Structure](#directory-structure)
- [Technologies & Configuration](#technologies--configuration)
- [Documentation](#documentation)

---

## Main Pages

| Page | File | URL | Priority |
|------|------|-----|----------|
| Home | `index.html` | https://toxi.media/ | High |
| Main | `main.html` | https://toxi.media/main.html | High |
| App | `app.html` | https://toxi.media/app.html | High |

---

## Entertainment & Content

### Streaming & Broadcasting
| Page | File | Type | Update Frequency |
|------|------|------|------------------|
| TV | `tv.html` | Live streaming | Daily |
| Radio | `radio.html` | Live streaming | Daily |
| Schedule | `schedule.html` | Program guide | Weekly |
| Zapping | `zapping.html` | Channel guide | Weekly |
| Playlist | `playlist.csv` | Music playlist | Daily |

### MERS Vlog
| Page | File | Description |
|------|------|-------------|
| MERS Vlog | `mers-vlog.html` | Main vlog page |
| MERS Vlog Cast | `mers-vlog-cast.html` | Chromecast support |
| Cast Receiver | `cast-receiver.html` | Google Cast receiver |

---

## Themed Experiences

| Theme | File | Type |
|-------|------|------|
| Matriz | `matriz.html` | Interactive experience |
| Detective Noir | `detective-noir.html` | Mystery theme |
| Hedonismo y Seducción | `hedonismo-y-seduccion.html` | Lifestyle content |
| Ariana Grande | `ariana-grande/index.html` | Music tribute |
| Hotel Oriente | `hotel-oriente.html` | Hotel experience |
| Earth | `earth.html` | 3D visualization |
| Line | `line.html` | Abstract/geometric |
| Point | `point.html` | Interactive |
| Audiont | `audiont.html` | Audio experience |

---

## Events & Special Pages

| Event | File | Description |
|-------|------|-------------|
| We Will Rock You | `we-will-rock-you.html` | Music event |
| Venado Tuerto: El Musical | `venado-tuerto-el-musical.html` | Theater production |
| XPLORA Night Live | `xplora-night-live.html` | Live event |
| XPLORA Night Live - Countdown Overlay | `xplora-night-live-overlay-countdown.html` | Event overlay |

---

## Miscellaneous Pages

| Page | File | Purpose |
|------|------|---------|
| Nota Constante | `nota-constante.html` | Content page |
| Otro Día en la Red | `otro-dia-en-la-red.html` | Daily content |
| Trabajos | `trabajos.html` | Portfolio/Works |
| Onboarding | `onboarding.html` | User onboarding |
| Plantform | `plantform.html` | Platform page |
| Toxi One Pager | `toxi-one-pager.html` | Single page summary |
| Reporte Ximena | `reporte-ximena.html` | Report page |
| VR | `vr.html` | Virtual reality |
| University | `university.html` | Course index |
| University: Historia Argentina | `university/historia-argentina.html` | Course detail |
| University: Streaming | `university/como-streamear.html` | Course detail |
| Wiki | `wiki.html` | Knowledge base |
| Turing | `turing.html` | AI/Tech section |
| Turing Admin | `turing-admin.html` | Administration panel |

---

## Legal

| Page | File |
|------|------|
| Privacy Policy | `privacy-policy.html` |

---

## Directory Structure

### Core Application
```
src/                       Source code (Vue/React components, utilities)
public/                    Static assets (public files)
dist/                      Production build output
dev-dist/                  Development build output
```

### Backend & API
```
api/                       API endpoints and backend services
```

### Mobile Applications
```
toxi-radio-android/        Android radio app
toxi-tv-android/           Android TV app
toxi-tv-ios/               iOS TV app
```

### Content & Resources
```
casting/                   Casting information and submissions
candidatos/                Candidate information
_archive/                  Archived content and files
webflow-exports/           Exported Webflow projects
tools/                     Utility scripts and tools
public/                    Public-facing assets
```

### 3D & Media Assets
```
3d logo hora toxi.blend    Blender 3D model (main logo)
3d logo hora toxi.blend1   Blender backup file
```

### Documentation
```
README.md                  Project overview
STREAMING_GUIDE.md         Streaming instructions
STREAMING_PRODUCTION.md    Production streaming setup
toxi-grilla-2026-05-04.md  Programming schedule
```

---

## Technologies & Configuration

### Build & Development
- **Vite Configuration**: `vite.config.js`
- **Node Package Manager**: `package.json`, `package-lock.json`
- **Replit Configuration**: `.replit`
- **Environment**: `.env.local`

### Version Control
- **Git**: `.git/`, `.gitignore`
- **GitHub**: `.github/`
- **Vercel**: `.vercel/`, `vercel.json`

### Code Editor
- **VS Code**: `.vscode/`

### Build Outputs & Artifacts
- **Static Generation**: `generate-static.js`
- **CSV Parser**: `parse-csvs.js`
- **Python Scripts**: 
  - `gen_feature_graphic.py` - Generate feature graphics
  - `ocean_particles_blender.py` - Blender particle system
  - `gen_playlist_csv.mjs` - Generate playlists

### Database
- **Turing Database Setup**: `turing-db-setup.sql`

### Reports & Data
- **Mux Upload Results**: `mux-upload-results.json`
- **Mux Playlist Quality Report**: `mux-playlist-quality-report.txt`

---

## Media Assets

### Images & Graphics
- `toxi-app-logo.jpg` - App logo
- `toxi-logomark-transparent-lg.png` - Logomark
- `feature-graphic.png` - Feature graphic
- `mundo toxi refe.png` - Reference image
- `xplora-night-live-logo.png` - Event logo

### Video
- `02 the pyramid unlocks.mp4` - Video asset

### Images/Screenshots
- `01 all zones locked.png` - Screenshot/reference

---

## API Endpoints
Located in `api/` directory (specific endpoints depend on backend implementation)

---

## Summary Statistics

| Category | Count |
|----------|-------|
| HTML Pages | 32+ |
| Image Assets | 5+ |
| Video Assets | 1+ |
| Mobile Apps | 3 |
| Directories | 15+ |
| Configuration Files | 8+ |
| Documentation Files | 3 |
| Total Files | 50+ |

---

## Notes

- This sitemap is auto-generated based on the file structure as of 2026-08-13
- Pages are organized by function and content type
- Priority levels are suggested for search engine crawling
- Update frequencies reflect typical content change patterns
- The `node_modules/` directory contains npm dependencies and is not listed individually
- Mobile apps are distributed via separate channels (Google Play, Apple App Store)

---

**For updates to this sitemap, regenerate based on the current directory structure.**
