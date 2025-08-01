import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Composant pour un nuage de particules étoiles sur une sphère
const StarField: React.FC<{
  count?: number
  radius?: number
  color?: string
  size?: number
}> = ({ count = 1000, radius = 180, color = '#fff', size = 8 }) => {
  const pointsRef = useRef<THREE.Points>(null)

  // Génère les positions et couleurs des étoiles une seule fois
  const { positions, colors, sizes } = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const sizesArr = []
    const colorObj = new THREE.Color(color)
    let i = 0
    while (i < count) {
      // Répartition sphérique uniquement dans le ciel (y > 0)
      const phi = Math.acos(Math.random()) // [0, PI/2] pour y >= 0
      const theta = 2 * Math.PI * Math.random()
      const r = radius + (Math.random() - 0.5) * 10
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.cos(phi)
      const z = r * Math.sin(phi) * Math.sin(theta)
      if (y > 0) {
        positions.push(x, y, z)
        colorObj.toArray(colors, i * 3)
        sizesArr.push(size + Math.random() * size * 0.7)
        i++
      }
    }
    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizesArr)
    }
  }, [count, radius, color, size])

  // Animation scintillement
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const t = clock.getElapsedTime()
      const sizesAttr = (pointsRef.current.geometry as THREE.BufferGeometry).attributes.size
      for (let i = 0; i < count; i++) {
        sizesAttr.array[i] = sizes[i] * (0.7 + 0.3 * Math.sin(t * 0.7 + i))
      }
      sizesAttr.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-customColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={`
          attribute float size;
          attribute vec3 customColor;
          varying vec3 vColor;
          void main() {
            vColor = customColor;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            float alpha = smoothstep(0.5, 0.2, d);
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
        blending={THREE.AdditiveBlending}
        depthTest={false}
        transparent
      />
    </points>
  )
}

export default StarField
