HI TWIN! <br>
https://about-wimmboo.vercel.app <br>
BYE TWIN!

# P3R-style About Me

A Persona 3 Reload pause-menu styled portfolio. Vite + React + React Router + framer-motion.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/ (vercel.json handles SPA routes)
```

## Where to change things

| What | Where |
| --- | --- |
| Intro lines, facts, playlist links + discord on /about, GitHub username, timezone, fallback repos | `src/content.js` (search for `PLACEHOLDER`) |
| Menu items, their size and lean | `menuItems` in `src/content.js` (`size`, `x`, `y`, `skew`, `skewY`) |
| GITHUB menu behavior (`'profile'` opens github.com in a new tab, `'page'` uses the `/github` stub) | `githubMode` in `src/content.js` |
| Which data goes in which slot of a project row (e.g. swap "days old" for stars) | `projectFields` in `src/content.js` |
| Background videos | Put files in `public/videos/`, then update `videos` in `src/content.js`. Which route uses which video + overlay is `routeBackgrounds` in the same file. |
| Fonts | `src/styles/variables.css` (the four `--font-*` lines) and the Google Fonts `<link>` in `index.html` |
| Colors | `src/styles/variables.css` |
| How dark /projects and /about get | `--projects-dim` and `--about-dim` in `src/styles/variables.css` |
| Diagonal "PROJECTS" watermark | `showProjectsWatermark` in `src/content.js` |

## Videos

- `public/videos/pause-menu.mp4`: from `assets/Persona 3 Reload's Pause Menu (Clean).mp4`. The original starts with a ~2s white intro splash, so this is only the underwater part (1.9s to 6.1s), crossfaded into a seamless 3.4s loop.
- `public/videos/skills-menu.mp4`: from `assets/Persona 3 Reload - Clean Skills Menu Loop (Wallpaper Engine).mp4`, same video with the audio track removed.
- `*-poster.jpg`: first frame of each, shown until the video can play.

The site never plays sound: the audio tracks are removed and the `<video>` is muted.
The `assets/` folder is no longer used by the site, so you can delete it if you want the repo smaller.

## Credits

The landing menu is ported from [blairxu13/persona3-website](https://github.com/blairxu13/persona3-website)'s `P3Menu` (same font, colors, skews and triangle highlight).

## How it's put together

- `src/components/WaterTransition.jsx` handles every route change: Esc, the menu, and browser back/forward. The water rises (Web Animations API, a transform only, so it runs on the compositor), the route and background video swap while the screen is covered, then the water drains. Clicks and keys are blocked while it runs. With `prefers-reduced-motion` it's a quick fade instead.
- `src/components/BackgroundVideo.jsx` is the one persistent `<video>`. Both videos are preloaded as blobs on first load.
- `src/lib/github.js` fetches your latest 3 non-fork, non-archived repos and caches them in sessionStorage for 10 min. If GitHub fails or rate-limits, it falls back to `fallbackRepos`.
