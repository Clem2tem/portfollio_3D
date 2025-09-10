import React from 'react'

const Lighting: React.FC = () => {
  return (
    <>
      {/* Lumière ambiante douce */}
      <ambientLight intensity={0.2} />
      <directionalLight
        castShadow
        intensity={1.2}
        position={[30, 90, 30]}
      />
    </>
  )
}

export default Lighting
