import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Scene from './components/Scene'
import UI from './components/UI'
import LoadingScreen from './components/LoadingScreen'

function App() {
  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Canvas 3D */}
      <Canvas
        camera={{ 
          position: [0, 8, 12], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* Interface utilisateur overlay */}
      <UI />

      {/* Loading screen */}
      <Suspense fallback={<LoadingScreen />}>
        <div />
      </Suspense>
    </div>
  )
}

export default App
