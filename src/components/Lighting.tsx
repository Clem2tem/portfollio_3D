import React from 'react'

const Lighting: React.FC = () => {
  return (
    <>
      {/* Lumière ambiante douce */}
      <ambientLight
        intensity={0.4}
        position={[5, 10, 5]}
      />
      <directionalLight
        castShadow
        intensity={0.6}
        position={[5, 10, 5]}
      />
    </>
  )
}

export default Lighting
