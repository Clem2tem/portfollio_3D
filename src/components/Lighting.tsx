import React, { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface LightingProps {
  enableShadows?: boolean
}

const Lighting: React.FC<LightingProps> = ({ enableShadows = true }) => {
  const directionalRef = useRef<THREE.DirectionalLight>(null)
  const { gl } = useThree()

  useEffect(() => {
    // Configure shadow map settings for better performance
    if (gl.shadowMap) {
      gl.shadowMap.enabled = enableShadows
      gl.shadowMap.type = THREE.PCFSoftShadowMap // Good balance between quality and performance
    }

    // Optimize shadow camera bounds
    if (directionalRef.current && enableShadows) {
      const shadowCam = directionalRef.current.shadow.camera
      shadowCam.left = -20
      shadowCam.right = 20
      shadowCam.top = 20
      shadowCam.bottom = -20
      shadowCam.near = 0.5
      shadowCam.far = 150
      shadowCam.updateProjectionMatrix()
      
      // Optimize shadow map resolution (lower for better performance)
      directionalRef.current.shadow.mapSize.width = 1024
      directionalRef.current.shadow.mapSize.height = 1024
      directionalRef.current.shadow.bias = -0.0001
    }
  }, [gl, enableShadows])

  return (
    <>
      {/* Lumière ambiante douce */}
      <ambientLight intensity={0.2} />
      <directionalLight
        ref={directionalRef}
        castShadow={enableShadows}
        intensity={1.2}
        position={[30, 90, 30]}
      />
    </>
  )
}

export default Lighting
