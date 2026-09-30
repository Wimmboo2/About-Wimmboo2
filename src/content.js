/* ==========================================================================
   CONTENT & CONFIG — everything you'd want to edit lives in this file.
   Search for "PLACEHOLDER" to find the bits you need to replace.
   ========================================================================== */

/* ---------- GitHub ---------------------------------------------------- */

// PLACEHOLDER: your GitHub username (used for /projects data + the GITHUB menu item)
export const githubUsername = 'YOUR_USERNAME'

// 'profile' → GITHUB menu item opens github.com/{username} in a new tab (default)
// 'page'    → GITHUB menu item navigates to the /github stub route (fill it in later)
export const githubMode = 'profile'

// Timezone used for the date / weekday / time-of-day on project rows.
// null = the visitor's local time. PLACEHOLDER (optional): e.g. 'Asia/Tokyo'
export const timezone = null

// Big faint diagonal "PROJECTS" watermark behind the save rows (like "REWIND").
export const showProjectsWatermark = false

/* ---------- Background videos ------------------------------------------
   Files live in /public/videos. Swap a video by dropping a new file there
   and changing the path here. Posters are optional first-frame JPGs.     */

export const videos = {
  pauseMenu: {
    src: '/videos/pause-menu.mp4',
    poster: '/videos/pause-menu-poster.jpg',
  },
  skillsMenu: {
    src: '/videos/skills-menu.mp4',
    poster: '/videos/skills-menu-poster.jpg',
  },
}

// Which video + overlay each route uses. Overlays are styled in styles/background.css.
export const routeBackgrounds = {
  '/': { video: 'pauseMenu', overlay: 'landing' },
  '/projects': { video: 'pauseMenu', overlay: 'projects' },
  '/about': { video: 'skillsMenu', overlay: 'about' },
  '/github': { video: 'pauseMenu', overlay: 'projects' },
}

/* ---------- Landing menu ---------------------------------------------- */

export const menuItems = [
  { id: 'about', label: 'ABOUT ME', to: '/about' },
  { id: 'github', label: 'GITHUB', github: true },
  { id: 'projects', label: 'PROJECTS', to: '/projects' },
]

/* ---------- /projects field mapping ------------------------------------
   Each slot on a save row reads from the repo object through this map.
   A slot is either a repo key (string) or a function (repo) => value.
   Repo objects have the GitHub API shape: name, description, language,
   stargazers_count, forks_count, pushed_at, created_at, visibility, html_url…
   Swap anything here without touching the components.                    */

const DAY = 24 * 60 * 60 * 1000
const daysSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY))

export const projectFields = {
  // drives the big M/D date, weekday badge, time-of-day label and moon phase
  date: 'pushed_at',
  // repo name (title bar on the selected row)
  title: 'name',
  // italic slot where "Lv 42" sits in the game
  subtitle: (r) => r.language || '—',
  // the big right-aligned number where play time sits
  bigNumber: (r) => daysSince(r.created_at),
  bigNumberLabel: 'DAYS OLD',
  // selected-row extras
  description: (r) => r.description || 'No description yet.',
  stars: 'stargazers_count',
  forks: 'forks_count',
  // tiny tag bottom-right where "NORMAL" appears in the game
  tag: (r) => (r.visibility || (r.private ? 'private' : 'public')).toUpperCase(),
  // where Enter / click on the selected row goes
  url: 'html_url',
}

// PLACEHOLDER: shown when GitHub is unreachable or rate-limited.
export const fallbackRepos = [
  {
    name: 'portfolio-p3r',
    description: 'This site. A Persona 3 Reload pause-menu styled about-me page.',
    language: 'JavaScript',
    stargazers_count: 3,
    forks_count: 0,
    pushed_at: '2026-09-28T16:20:00Z',
    created_at: '2026-08-02T10:00:00Z',
    visibility: 'public',
    html_url: 'https://github.com/',
  },
  {
    name: 'tartarus-tracker',
    description: 'Tracks floors, shadows and full-moon operations.',
    language: 'TypeScript',
    stargazers_count: 12,
    forks_count: 2,
    pushed_at: '2026-09-14T21:05:00Z',
    created_at: '2026-03-15T09:00:00Z',
    visibility: 'public',
    html_url: 'https://github.com/',
  },
  {
    name: 'velvet-room-api',
    description: 'Small REST API for fusing things together.',
    language: 'Python',
    stargazers_count: 7,
    forks_count: 1,
    pushed_at: '2026-08-30T08:40:00Z',
    created_at: '2025-11-01T12:00:00Z',
    visibility: 'public',
    html_url: 'https://github.com/',
  },
]

/* ---------- /about ----------------------------------------------------- */

export const about = {
  // PLACEHOLDER: the name shown on the dialogue name tag
  name: 'WIMMBOO',
  // PLACEHOLDER: what the dialogue box says, one entry per paragraph (typed out)
  intro: [
    'Hi, my name is Wimmboo.',
    'PLACEHOLDER: one or two more lines about you. Keep it short.',
  ],

  // PLACEHOLDER: 3-4 short facts
  facts: [
    { title: 'Based in', text: 'Your city, your country' },
    { title: 'Currently', text: 'Learning React animation and WebGL' },
    { title: 'Favorite game', text: 'Persona 3 Reload (obviously)' },
    { title: 'Fun fact', text: 'Something short and specific about you' },
  ],
}
