import { createContext, useContext, useEffect } from 'react'

export const TransitionContext = createContext(null)

// { displayedLocation, incoming, busy, go(path), back(), incomingRef, snapshotRef }
export const useTransitionNav = () => useContext(TransitionContext)

// Esc → back to landing (through the transition).
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
