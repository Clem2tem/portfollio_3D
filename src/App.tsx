import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import Scene from './components/Scene'
import UI from './components/UI'
import LoadingScreen from './components/LoadingScreen'
import CustomCursor from './components/CustomCursor'
import IntroScreen from './components/IntroScreen'

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
    <div className="w-full h-screen relative overflow-hidden" style={{ cursor: showIntro ? 'auto' : 'none' }}>
      {/* Écran d'introduction */}
      {showIntro && (
        <IntroScreen onEnterPortfolio={handleEnter3DWorld} />
      )}

      {/* Canvas 3D - affiché seulement après avoir cliqué sur entrer */}
      {!showIntro && (
        <Canvas
          camera={{ 
            position: hasEntered ? [0, 6, 10] : [0, 2, 0], 
            fov: 60,
            near: 0.1,
            far: 1000
          }}
          shadows
          className="absolute inset-0"
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
          }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Scene 
              isNightMode={isNightMode} 
              isEntering={isEntering}
              onAnimationComplete={handleAnimationComplete}
            />
          </Suspense>
        </Canvas>
      )}

      {/* Interface utilisateur overlay - masquée pendant l'intro */}
      {!showIntro && (
        <UI isNightMode={isNightMode} setIsNightMode={setIsNightMode} />
      )}

      {/* Curseur personnalisé - masqué pendant l'intro */}
      {!showIntro && <CustomCursor />}

      {/* Loading screen */}
      <Suspense fallback={<LoadingScreen />}>
        <div />
      </Suspense>
    </div>
  )
}

export default App
