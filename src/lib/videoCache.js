import { videos } from '../content.js'

// Preload every background video once as a Blob so route swaps never wait on
// the network. Until a blob is ready, the plain file URL is used instead.
const blobUrls = {}
let started = false

export function preloadVideos() {
  if (started || typeof fetch === 'undefined') return
  started = true
  Object.entries(videos).forEach(([key, v]) => {
    fetch(v.src)
      .then((res) => (res.ok ? res.blob() : Promise.reject(res.status)))
      .then((blob) => {
        blobUrls[key] = URL.createObjectURL(blob)
      })
      .catch(() => {
        /* fine: the <video> just streams the file normally */
      })
  })
}

export const resolveVideoSrc = (key) => blobUrls[key] || videos[key]?.src

/* ---- the single persistent <video>: registry so the transition can wait for it ---- */

let bgVideoEl = null
export const registerBgVideo = (el) => {
  bgVideoEl = el
}

// Resolves once the background video has a frame to show (or after `timeout` ms).
export function waitForBgVideo(timeout = 700) {
  const el = bgVideoEl
  if (!el || el.readyState >= 3) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(t)
      el.removeEventListener('canplay', done)
      el.removeEventListener('playing', done)
      resolve()
    }
    const t = setTimeout(done, timeout)
    el.addEventListener('canplay', done)
    el.addEventListener('playing', done)
  })
}
