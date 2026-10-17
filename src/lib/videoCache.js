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
