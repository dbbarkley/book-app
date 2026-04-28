'use client'

/**
 * CurtainContext — global state machine for the login transition curtain.
 *
 * States:
 *   idle      → curtain is not visible
 *   covering  → panels are closed, covering the screen (loading state)
 *   opening   → panels are splitting apart (auth succeeded)
 *
 * Usage:
 *   const { show, open, dismiss } = useCurtain()
 *
 *   show()    — immediately cover the screen (call on form submit)
 *   open()    — split panels apart (call on auth success)
 *   dismiss() — quickly hide curtain (call on auth error)
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

export type CurtainState = 'idle' | 'covering' | 'opening'

interface CurtainContextValue {
  state: CurtainState
  show: () => void
  open: () => void
  dismiss: () => void
}

const CurtainContext = createContext<CurtainContextValue>({
  state: 'idle',
  show:    () => {},
  open:    () => {},
  dismiss: () => {},
})

export function CurtainProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CurtainState>('idle')

  const show = useCallback(() => {
    setState('covering')
  }, [])

  const open = useCallback(() => {
    setState('opening')
    // Return to idle after the split animation has fully completed
    setTimeout(() => setState('idle'), 1000)
  }, [])

  const dismiss = useCallback(() => {
    // Fade out quickly — AnimatePresence handles the exit animation
    setState('idle')
  }, [])

  return (
    <CurtainContext.Provider value={{ state, show, open, dismiss }}>
      {children}
    </CurtainContext.Provider>
  )
}

export function useCurtain() {
  return useContext(CurtainContext)
}
