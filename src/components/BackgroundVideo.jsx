import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { routeBackgrounds, videos } from '../content.js'
import { useTransitionNav } from '../lib/transition.js'
import { preloadVideos, registerBgVideo, resolveVideoSrc, videoFileFor } from '../lib/videoCache.js'
import '../styles/background.css'

const bgFor = (pathname) => routeBackgrounds[pathname] || routeBackgrounds['/']

// One persistent <video> for the whole app. It swaps source when the page
// transition hands over (the incoming page's backdrop shows the same first
// frame, so the swap is invisible).
export default function BackgroundVideo() {
  const { displayedLocation } = useTransitionNav()
  const bg = bgFor(displayedLocation.pathname)
  const ref = useRef(null)
  const [initial] = useState(() => ({ src: videoFileFor(bg.video), poster: videos[bg.video].poster }))
  const currentKey = useRef(bg.video)

  useEffect(() => {
    const el = ref.current
    el.muted = true
    el.defaultMuted = true
    registerBgVideo(el)
    el.play().catch(() => {})
    preloadVideos()
    return () => registerBgVideo(null)
  }, [])

  // layout effect: the new poster/src must be set before the browser paints
  useLayoutEffect(() => {
    const el = ref.current
    if (currentKey.current === bg.video) return
    currentKey.current = bg.video
    el.poster = videos[bg.video].poster || ''
    el.src = resolveVideoSrc(bg.video)
    el.load()
    el.play().catch(() => {})
  }, [bg.video])

  return (
    <div className="bg" aria-hidden="true">
      <video
        ref={ref}
        className="bg__video"
        src={initial.src}
        poster={initial.poster}
        muted
        loop
        autoPlay
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
      />
      <div className={`bg__overlay bg__overlay--${bg.overlay}`} />
    </div>
  )
}
