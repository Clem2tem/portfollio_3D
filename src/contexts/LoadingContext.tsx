import React, { createContext, useContext, useState } from 'react'
import { useProgress } from '@react-three/drei'

type LoadingState = {
  progress: number
  loaded: boolean
  setProgress: (n: number) => void
}

const LoadingContext = createContext<LoadingState>({
  progress: 0,
  loaded: false,
  setProgress: () => {}
})

export const LoadingProvider: React.FC<React.PropsWithChildren<Record<string, unknown>>> = ({ children }) => {
  const [progress, setProgress] = useState(0)
  const loaded = progress >= 100
  return (
    <LoadingContext.Provider value={{ progress, loaded, setProgress }}>
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => useContext(LoadingContext)

// ProgressBridge must be rendered inside the R3F Canvas (so useProgress has a valid context)
export const ProgressBridge: React.FC = () => {
  const { progress } = useProgress()
  const { setProgress } = useLoading()
  React.useEffect(() => {
    // useProgress.progress is already a 0-100 value
    // Use requestAnimationFrame to avoid React warning about setState during render
    requestAnimationFrame(() => {
      setProgress(progress)
    })
  }, [progress, setProgress])
  return null
}

export default LoadingContext
