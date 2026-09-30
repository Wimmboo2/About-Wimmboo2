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

/* ---- the single persistent <video>: registry so the transition can use it ---- */

let bgVideoEl = null
export const registerBgVideo = (el) => {
  bgVideoEl = el
}

export const pauseBgVideo = () => bgVideoEl?.pause()
export const resumeBgVideo = () => bgVideoEl?.play().catch(() => {})

// Draw the background video's current frame into `canvas` exactly as it
// appears on screen (object-fit: cover, centered). Optional `zoom` crops to
// the centered fraction of the screen (the P3R blot uses 0.6), and `tint`
// multiplies the colors (the blot uses r×0.25, g×0.5, b×1).
export function drawBgFrame(canvas, { zoom = 1, tint } = {}) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  const el = bgVideoEl
  if (el && el.readyState >= 2 && el.videoWidth) {
    const vw = el.videoWidth
    const vh = el.videoHeight
    const scale = Math.max(W / vw, H / vh) // object-fit: cover
    const sw = (W / scale) * zoom
    const sh = (H / scale) * zoom
    ctx.drawImage(el, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, W, H)
  } else {
    ctx.fillStyle = '#0a16c8'
    ctx.fillRect(0, 0, W, H)
  }
  if (tint) {
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = tint
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'source-over'
  }
}
