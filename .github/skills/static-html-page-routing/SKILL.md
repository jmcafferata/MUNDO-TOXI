---
name: static-html-page-routing
description: "Use when creating or modifying a static HTML page in this Vite/Vercel project, especially pages under university/: ensure the page is included in the build, has a clean route, and is validated in dist."
---

# Static HTML Page Routing

When adding a static HTML page:

1. Put the source file in the appropriate project directory.
2. Confirm that `vite.config.js` discovers the file or add it to the Rollup input when it is outside the auto-discovered directories.
3. Use the general rewrites in `vercel.json`: `/university/<slug>` maps to `/university/<slug>.html`, and a root-level `/<slug>` maps to `/<slug>.html`. Add an individual rewrite only for a special route that does not follow one of these patterns.
4. Run `npm run build` and verify that the expected HTML file exists in `dist`.
5. Check the clean URL with the local preview or deployment preview, and confirm it does not fall back to the root `index.html`.

Do not consider a page finished until both its source file and its built output are present.