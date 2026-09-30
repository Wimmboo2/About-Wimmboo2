import { createContext, useContext, useEffect } from 'react'

export const TransitionContext = createContext(null)

// { displayedLocation, phase, busy, go(path), back() }
export const useTransitionNav = () => useContext(TransitionContext)

// True once the page is visible (the water has started draining or is idle).
export function useRevealed() {
  const { phase } = useTransitionNav()
  return phase === 'idle' || phase === 'draining'
}

// Esc → back to landing (through the water transition).
export function useEscBack() {
  const { back } = useTransitionNav()
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        back()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [back])
}
