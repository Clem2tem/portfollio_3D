import React, { createContext, useContext, useState } from 'react'

type SimplePos = { x: number; y: number; z: number } | null

type PlayerPositionAPI = {
  position: SimplePos
  setPosition: (p: SimplePos) => void
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
  const [position, setPosition] = useState<SimplePos>(null)

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
