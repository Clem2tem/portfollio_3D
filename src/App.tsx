import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import Scene from './components/Scene'
import UI from './components/UI'
import CustomCursor from './components/CustomCursor'
import IntroScreen from './components/IntroScreen'
import { LoadingProvider, ProgressBridge } from './contexts/LoadingContext'
import { PlayerPositionProvider } from './contexts/PlayerPositionContext'

function App() {
  const [isNightMode, setIsNightMode] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [isEntering, setIsEntering] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)

  const handleEnter3DWorld = () => {
    if (!hasEntered) {
      setIsEntering(true)
      setShowIntro(false)
      setHasEntered(true)
    }
  }

  const handleAnimationComplete = () => {
    setIsEntering(false)
  }

  return (
    <LoadingProvider>
      <PlayerPositionProvider>
        <div className="w-full h-screen relative overflow-hidden" style={{ cursor: showIntro ? 'auto' : 'none' }}>
      {/* Écran d'introduction */}
      {showIntro && (
        <IntroScreen onEnterPortfolio={handleEnter3DWorld} />
      )}

      {/* Canvas 3D - mounted always so we can preload assets while intro is shown */}
      <Canvas
        camera={{ 
          position: hasEntered ? [0, 6, 10] : [0, 2, 0], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
        className="absolute inset-0"
        style={{
          // keep canvas running but invisible / non-interactive while intro is visible
          visibility: showIntro ? 'hidden' : 'visible',
          pointerEvents: showIntro ? 'none' : undefined
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        {/* Mount a small bridge inside the Canvas to forward drei progress into app context */}
        <ProgressBridge />
        <Suspense fallback={null}>
          <Scene 
            isNightMode={isNightMode} 
            isEntering={isEntering}
            onAnimationComplete={handleAnimationComplete}
          />
        </Suspense>
      </Canvas>

      {/* Interface utilisateur overlay - masquée pendant l'intro */}
      {!showIntro && (
        <UI isNightMode={isNightMode} setIsNightMode={setIsNightMode} />
      )}

      {/* Curseur personnalisé - masqué pendant l'intro */}
      {!showIntro && <CustomCursor />}
      </div>
      </PlayerPositionProvider>
    </LoadingProvider>
  )
}

export default App
