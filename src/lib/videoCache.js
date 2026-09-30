import { videos } from '../content.js'

// Preload every background video once as a Blob so route swaps never wait on
// the network. Until a blob is ready, the plain file URL is used instead.
const blobUrls = {}
let started = false

// 720p on phones / small screens, 1080p elsewhere
const small = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches

export const videoFileFor = (key) => {
  const v = videos[key]
  return (small() && v?.srcSmall) || v?.src
}

export function preloadVideos() {
  if (started || typeof fetch === 'undefined') return
  started = true
  Object.keys(videos).forEach((key) => {
    fetch(videoFileFor(key))
      .then((res) => (res.ok ? res.blob() : Promise.reject(res.status)))
      .then((blob) => {
        blobUrls[key] = URL.createObjectURL(blob)
      })
      .catch(() => {
        /* fine: the <video> just streams the file normally */
      })
  })
}

export const resolveVideoSrc = (key) => blobUrls[key] || videoFileFor(key)

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
