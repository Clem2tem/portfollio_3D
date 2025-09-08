import React from 'react'

const Lighting: React.FC = () => {
  return (
    <>
      {/* Lumière ambiante douce */}
      <directionalLight
        intensity={0.5}
        position={[5, 10, 5]}
      />
    </>
  )
}

export default Lighting
