import { MotionConfig } from 'framer-motion'
import { Navigate, Route, Routes } from 'react-router-dom'
import BackgroundVideo from './components/BackgroundVideo.jsx'
import PageTransition from './components/PageTransition.jsx'
import { githubMode } from './content.js'
import { useTransitionNav } from './lib/transition.js'
import About from './pages/About.jsx'
import GithubStub from './pages/GithubStub.jsx'
import Landing from './pages/Landing.jsx'
import Projects from './pages/Projects.jsx'

const KNOWN_PATHS = ['/', '/about', '/projects', ...(githubMode === 'page' ? ['/github'] : [])]

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

// Renders the *displayed* location, which only changes while the transition
// covers the screen.
function Stage() {
  const { displayedLocation } = useTransitionNav()
  return (
    <div className="stage">
      <PageRoutes location={displayedLocation} />
    </div>
  )
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
