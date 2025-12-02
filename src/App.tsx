import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Scene from './components/Scene'
import UI from './components/UI'
import CustomCursor from './components/CustomCursor'
import NewHomePage from './components/NewHomePage'
import { LoadingProvider, ProgressBridge } from './contexts/LoadingContext'
import { PlayerPositionProvider } from './contexts/PlayerPositionContext'
import { ProjectViewProvider } from './contexts/ProjectViewContext'
import { SpeedInsights } from "@vercel/speed-insights/next"


function App() {
  const [currentView, setCurrentView] = useState<'home' | '3d'>('home')
  const [isNightMode, setIsNightMode] = useState(false)
  const [isEntering, setIsEntering] = useState(false)

  const handleEnter3DMode = () => {
    setCurrentView('3d')
    setIsEntering(true)
  }

  const handleBackToHome = () => {
    setCurrentView('home')
  }

  const handleAnimationComplete = () => {
    setIsEntering(false)
  }

  return (
    <LoadingProvider>
      <ProjectViewProvider>
        <PlayerPositionProvider>
          <div
            className={`w-full relative ${
              currentView === 'home' ? 'min-h-screen overflow-visible' : 'h-screen overflow-hidden'
            }`}
          >

            {/* HomePage */}
            {currentView === 'home' && (
              <NewHomePage onEnter3DMode={handleEnter3DMode} />
            )}

            {/* 3D World */}
            {currentView === '3d' && (
              <Canvas
                gl={{ antialias: true }}
                camera={{
                  fov: 60,
                  position: [0, 6, 10],
                  near: 0.1,
                  far: 1000
                }}
                style={{
                  visibility: 'visible',
                  pointerEvents: undefined
                }}
                shadows
                className="absolute inset-0"
                dpr={[1, 2]}
              >
                <ProgressBridge />
                <Suspense fallback={null}>
                  <Scene
                    isNightMode={isNightMode}
                    isEntering={isEntering}
                    onAnimationComplete={handleAnimationComplete}
                  />
                </Suspense>
              </Canvas>
            )}

            {/* UI pour le mode 3D */}
            {currentView === '3d' && (
              <UI
                isNightMode={isNightMode}
                setIsNightMode={setIsNightMode}
                onBackToHome={handleBackToHome}
              />
            )}

            <CustomCursor />
          </div>
        </PlayerPositionProvider>
      </ProjectViewProvider>
    </LoadingProvider>
  )
}

export default App
