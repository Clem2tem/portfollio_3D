import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function CustomCameraController({ section }: { section: any }) {
  const { camera } = useThree()
  const mouse = useRef({ x: 0, y: 0 })
  const target = useRef(new THREE.Vector3(0, 1, 0))

  const sectionPositions: { pos: [number, number, number]; look: [number, number, number] }[] = [
    { pos: [0, 1, 5], look: [0, 1, 0] },
    { pos: [2, 1.2, 4], look: [0, 1, 0] },
    { pos: [-1.5, 1, 3.5], look: [0, 1, 0] },
    { pos: [0, 2, 6], look: [0, 1, 0] },
  ]

  const lerp = THREE.MathUtils.lerp

  useEffect(() => {
    window.addEventListener("mousemove", (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    })
  }, [])

  useFrame(() => {
    const s = sectionPositions[section] ?? sectionPositions[0]

    camera.position.x = lerp(camera.position.x, s.pos[0] + mouse.current.x * 0.3, 0.05)
    camera.position.y = lerp(camera.position.y, s.pos[1] - mouse.current.y * 0.2, 0.05)
    camera.position.z = lerp(camera.position.z, s.pos[2], 0.05)

    target.current.set(...s.look)
    camera.lookAt(target.current)
  })

  return null
}
