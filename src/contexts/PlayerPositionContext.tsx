import React, { createContext, useContext, useState } from 'react'

type LookAt = { x: number; y?: number; z: number }

type PlayerFocus = { x: number; y: number; z: number; lookAt?: LookAt } | null

type PlayerPositionAPI = {
  position: PlayerFocus
  setPosition: (p: PlayerFocus) => void
  clearPosition: () => void
}

const PlayerPositionContext = createContext<PlayerPositionAPI>({
  position: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setPosition: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearPosition: () => {}
})

export const PlayerPositionProvider: React.FC<React.PropsWithChildren<Record<string, unknown>>> = ({ children }) => {
  const [position, setPosition] = useState<PlayerFocus>(null)

  const api: PlayerPositionAPI = {
    position,
    setPosition,
    clearPosition: () => setPosition(null)
  }

  return (
    <PlayerPositionContext.Provider value={api}>
      {children}
    </PlayerPositionContext.Provider>
  )
}

export const usePlayerPosition = () => useContext(PlayerPositionContext)

export default PlayerPositionContext
