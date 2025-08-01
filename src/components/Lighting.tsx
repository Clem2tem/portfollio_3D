import React from 'react'

const Lighting: React.FC = () => {
  return (
    <>
      {/* Lumière ambiante douce */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Lumière directionnelle principale (soleil) */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        color="#ffeaa7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Lumière de remplissage (bleu ciel) */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.3}
        color="#74b9ff"
      />
      
      {/* Lumière ponctuelle pour les détails */}
      <pointLight
        position={[0, 8, 0]}
        intensity={0.5}
        color="#ffffff"
        distance={20}
        decay={2}
      />
      
      {/* Lumière de rim pour les contours */}
      <directionalLight
        position={[0, 2, -10]}
        intensity={0.2}
        color="#a29bfe"
      />
    </>
  )
}

export default Lighting
