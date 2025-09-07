import React, { useEffect } from 'react'
import * as THREE from 'three'
import { usePlayerPosition } from '../contexts/PlayerPositionContext'
import { Project } from '../types/Project'

type Props = {
  project: Project
  radius?: number
  visible?: boolean
  // setter provided by ProjectBuildings to update which project id is active
  setInZone: (id: string | null) => void
  // current active id from parent so the zone can avoid clobbering other zones
  currentInZone: string | null
}

const ProjectZone: React.FC<Props> = ({ project, radius = 2.5, visible = false, setInZone, currentInZone }) => {
  const playerPos = usePlayerPosition().position

  // compute membership whenever playerPos changes
  useEffect(() => {
    if (!playerPos) return
    try {
      const px = playerPos.x
      const pz = playerPos.z
      const center = Array.isArray(project.position) ? project.position : [project.position[0], project.position[1], project.position[2]]
      const dx = px - center[0]
      const dz = pz - center[2]
      const distSq = dx * dx + dz * dz
      if (distSq <= radius * radius) {
        // only set if not already the current
        if (currentInZone !== project.id) {
          setInZone(project.id)
        }
      } else {
        // if we were the one setting it, clear it; otherwise leave it alone
        if (currentInZone === project.id) {
          setInZone(null)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [playerPos, project, radius, setInZone, currentInZone])

  // Visual: tall cylinder centered at project.position. We can't do infinite height, so use a large value.
  const HEIGHT = 200
  const centerPos = Array.isArray(project.position) ? project.position : [project.position[0], project.position[1], project.position[2]]
  const groupRef = React.useRef<THREE.Group | null>(null)

  React.useEffect(() => {
    if (!groupRef.current) return
    try {
      const worldPos = new THREE.Vector3(centerPos[0], centerPos[1], centerPos[2])
      if (groupRef.current.parent) {
        const inv = new THREE.Matrix4().copy(groupRef.current.parent.matrixWorld).invert()
        const local = worldPos.clone().applyMatrix4(inv)
        groupRef.current.position.copy(local)
      } else {
        groupRef.current.position.copy(worldPos)
      }
    } catch (e) {
      // ignore
    }
  }, [centerPos])

  return (
    <group ref={groupRef}>
      {visible && (
        <mesh position={[0, HEIGHT / 2, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[radius, radius, HEIGHT, 48]} />
          <meshStandardMaterial color="#00bcd4" opacity={0.18} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

export default ProjectZone
