import { MotionConfig } from 'framer-motion'
import { Navigate, Route, Routes } from 'react-router-dom'
import BackgroundVideo from './components/BackgroundVideo.jsx'
import WaterTransition from './components/WaterTransition.jsx'
import { githubMode } from './content.js'
import { useTransitionNav } from './lib/transition.js'
import About from './pages/About.jsx'
import GithubStub from './pages/GithubStub.jsx'
import Landing from './pages/Landing.jsx'
import Projects from './pages/Projects.jsx'

const KNOWN_PATHS = ['/', '/about', '/projects', ...(githubMode === 'page' ? ['/github'] : [])]

// Routes render the *displayed* location, which only changes while the
// water covers the screen.
function AppRoutes() {
  const { displayedLocation } = useTransitionNav()
  return (
    <Routes location={displayedLocation}>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />
      {githubMode === 'page' && <Route path="/github" element={<GithubStub />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <WaterTransition knownPaths={KNOWN_PATHS}>
        <BackgroundVideo />
        <AppRoutes />
      </WaterTransition>
    </MotionConfig>
  )
}
