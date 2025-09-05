// HitboxVisualizer.tsx — adapté à la version BVH
import React, { useMemo } from 'react'
import * as THREE from 'three'
import { getCollisionObjectsGlobal } from '../hooks/usePreciseCollisions'

type Collider = {
  name: string
  mesh: THREE.Mesh            // mesh invisible créé par le hook (géométrie déjà en world space)
  boundingBox: THREE.Box3
  isStatic: boolean
}

interface HitboxVisualizerProps {
  visible: boolean
  playerPosition: THREE.Vector3
  playerRadius?: number
  colliders?: Collider[]
  showColliderMeshes?: boolean   // affiche la géométrie de collision précise (wireframe)
  showBoundingBoxes?: boolean    // affiche aussi les AABB
  filterMode?: 'all' | 'island' | 'others' // filtre d'affichage
}

export const HitboxVisualizer: React.FC<HitboxVisualizerProps> = ({
  visible,
  playerPosition,
  playerRadius = 0.05,
  colliders,
  showColliderMeshes = true,
  showBoundingBoxes = false,
  filterMode = 'all',
}) => {
  if (!visible) return null

  // by default, read from the global store populated by the collisions hook
  const all = colliders ?? getCollisionObjectsGlobal()

  // Filtrer selon le mode sélectionné
  const filtered = useMemo(() => {
    const isIsland = (name: string) => name.toLowerCase().includes('island')
    if (filterMode === 'island') return all.filter(c => isIsland(c.name))
    if (filterMode === 'others') return all.filter(c => !isIsland(c.name))
    return all
  }, [all, filterMode])

  // Matériaux partagés (évite de recréer à chaque render)
  const playerMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('green'),
        wireframe: true,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    []
  )

  // const colliderMat = useMemo(
  //   () =>
  //     new THREE.MeshBasicMaterial({
  //       color: new THREE.Color('red'),
  //       wireframe: true,
  //       transparent: true,
  //       opacity: 0.35,
  //       depthWrite: false,
  //     }),
  //   []
  // )

  const boxMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('yellow'),
        wireframe: true,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    []
  )

  // Couleur optionnelle par nom d’objet (facultatif)
  const colorFor = (name: string) => name.toLowerCase().includes('island') ? new THREE.Color('blue') : new THREE.Color('magenta')

  return (
    <group>
      {/* Sphère de collision du joueur (centrée à y + radius si c'est ta convention) */}
      <mesh position={[playerPosition.x, playerPosition.y + playerRadius, playerPosition.z]}>
        <sphereGeometry args={[playerRadius, 12, 12]} />
        <primitive object={playerMat} attach="material" />
      </mesh>

    {/* Visualisation des colliders */}
  {filtered.map((c, i) => {
        const color = colorFor(c.name)

        return (
          <group key={`collider-${c.name}-${i}`}>
            {showColliderMeshes && c.mesh?.geometry && (
              // ⚠️ La géométrie de collision a déjà été "baked" en world space dans le hook.
              // On la rend donc avec matrixAutoUpdate={false} et sans transform supplémentaire.
              <mesh
                geometry={c.mesh.geometry}
                matrixAutoUpdate={false}
                frustumCulled={false}
                renderOrder={-1}
              >
                {/* On clone le material wireframe en changeant juste la couleur */}
                <meshBasicMaterial
                  color={color}
                  wireframe
                  transparent
                  opacity={0.35}
                  depthWrite={false}
                />
              </mesh>
            )}

            {showBoundingBoxes && c.boundingBox && (() => {
              const size = new THREE.Vector3()
              const center = new THREE.Vector3()
              c.boundingBox.getSize(size)
              c.boundingBox.getCenter(center)
              return (
                <mesh position={[center.x, center.y, center.z]}>
                  <boxGeometry args={[size.x, size.y, size.z]} />
                  <primitive object={boxMat} attach="material" />
                </mesh>
              )
            })()}
          </group>
        )
      })}
    </group>
  )
}
