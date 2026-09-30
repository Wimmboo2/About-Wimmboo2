import { MotionConfig } from 'framer-motion'
import { Navigate, Route, Routes } from 'react-router-dom'
import BackgroundVideo from './components/BackgroundVideo.jsx'
import PageTransition from './components/PageTransition.jsx'
import { githubMode, routeBackgrounds, videos } from './content.js'
import { useTransitionNav } from './lib/transition.js'
import About from './pages/About.jsx'
import GithubStub from './pages/GithubStub.jsx'
import Landing from './pages/Landing.jsx'
import Projects from './pages/Projects.jsx'

const KNOWN_PATHS = ['/', '/about', '/projects', ...(githubMode === 'page' ? ['/github'] : [])]
const bgFor = (pathname) => routeBackgrounds[pathname] || routeBackgrounds['/']

function PageRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />
      {githubMode === 'page' && <Route path="/github" element={<GithubStub />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// During a transition two pages are mounted: the current one, and the
// incoming one on top (revealed by PageTransition). Layers are keyed by
// location, so when the incoming page takes over it keeps its state.
function Stage() {
  const { displayedLocation, incoming, incomingRef, snapshotRef } = useTransitionNav()
  const layers = [{ location: displayedLocation }]
  if (incoming) layers.push({ ...incoming, isIncoming: true })

  return layers.map((layer) => {
    const bg = bgFor(layer.location.pathname)
    return (
      <div
        key={layer.location.key}
        ref={layer.isIncoming ? incomingRef : undefined}
        className={layer.isIncoming ? 'stage stage--incoming' : 'stage'}
        style={layer.isIncoming ? { clipPath: 'path("M0 0Z")' } : undefined}
      >
        {layer.isIncoming && (
          // the incoming page's own background until the real video takes over
          <div className="stage__backdrop" aria-hidden="true">
            {layer.backdrop === 'snapshot' ? (
              <canvas ref={snapshotRef} />
            ) : (
              <img src={videos[bg.video].poster} alt="" />
            )}
            <div className={`bg__overlay bg__overlay--${bg.overlay}`} />
          </div>
        )}
        <PageRoutes location={layer.location} />
      </div>
    )
  })
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <PageTransition knownPaths={KNOWN_PATHS}>
        <BackgroundVideo />
        <Stage />
      </PageTransition>
    </MotionConfig>
  )
}
