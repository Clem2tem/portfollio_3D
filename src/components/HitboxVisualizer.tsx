// HitboxVisualizer.tsx — adapté à la version BVH
import React, { JSX, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCollisionObjectsGlobal } from '../hooks/usePreciseCollisions'
import { PLAYER_RADIUS as PHYS_PLAYER_RADIUS } from '../hooks/usePrecisePlayerPhysics'

type Collider = {
  name: string
  mesh: THREE.Mesh            // mesh invisible créé par le hook (géométrie déjà en world space)
  boundingBox: THREE.Box3
  isStatic: boolean
  sourceObject?: THREE.Object3D
  animated?: boolean
  bakeMatrix?: THREE.Matrix4
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

  // Radius to render: prefer prop if given, else physics export
  const radius = playerRadius ?? PHYS_PLAYER_RADIUS

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

  // one-time debug log per collider
  const logged = useRef<WeakSet<any>>(new WeakSet())

  // refs for dynamic meshes we need to update each frame
  const meshRefs = useRef<Record<string, THREE.Mesh | null>>({})
  const sourceRefs = useRef<Record<string, any>>({})

  // update animated parts / rebased baked meshes each frame
  useFrame(() => {
    for (const key of Object.keys(meshRefs.current)) {
      const mesh = meshRefs.current[key]
      const src = sourceRefs.current[key]
      if (!mesh || !src) continue
      // if key starts with 'part-' we copy child.matrixWorld
      if (key.startsWith('part-')) {
        mesh.matrix.copy(src.matrixWorld)
        mesh.matrixWorldNeedsUpdate = true
      } else if (key.startsWith('baked-')) {
        // baked mesh: compute rebase = current * inverse(bake)
        const bake = (src as any)?.bakeMatrix as THREE.Matrix4 | undefined
        const current = (src as any)?.sourceObject?.matrixWorld ?? src.sourceObject?.matrixWorld ?? src.matrixWorld
        const rebase = new THREE.Matrix4()
        if (bake) {
          const invBake = bake.clone().invert()
          rebase.multiplyMatrices(current, invBake)
        } else {
          rebase.copy(current)
        }
        mesh.matrix.copy(rebase)
        mesh.matrixWorldNeedsUpdate = true
      }
    }
  })

  return (
    <group>
      {/* Sphère de collision du joueur (centrée à y + radius si c'est ta convention) */}
      <mesh position={[playerPosition.x, playerPosition.y + radius, playerPosition.z]}>
        <sphereGeometry args={[radius, 12, 12]} />
        <primitive object={playerMat} attach="material" />
      </mesh>

      {/* Visualisation des colliders */}
      {filtered.map((c, i) => {
        // debug log once per collider
        try {
          if (!logged.current.has(c)) {
            const src = c.sourceObject
            const bake = (c as any).bakeMatrix
            // eslint-disable-next-line no-console
            console.log('[HitboxVisualizer] collider', c.name, 'animated=', !!c.animated, 'source=', src?.name || src?.uuid, 'hasBake=', !!bake)
            logged.current.add(c)
          }
        } catch (e) {}

        const color = colorFor(c.name)

        return (
          <group key={`collider-${c.name}-${i}`}>
            {showColliderMeshes && c.mesh?.geometry && (() => {
              // Static: render baked mesh directly
              if (!c.animated || !c.sourceObject) {
                return (
                  <mesh
                    geometry={c.mesh.geometry}
                    matrixAutoUpdate={false}
                    frustumCulled={false}
                    renderOrder={-1}
                  >
                    <meshBasicMaterial
                      color={color}
                      wireframe
                      transparent
                      opacity={0.35}
                      depthWrite={false}
                    />
                  </mesh>
                )
              }

              // Animated: try to render per-descendant non-skinned meshes so transforms are exact for rigid parts
              try {
                const parts: JSX.Element[] = []
                let partIndex = 0
                c.sourceObject.traverse((n) => {
                  if ((n as any).isMesh && n !== c.mesh) {
                    const child = n as THREE.Mesh
                    // skip skinned meshes here; they require a different rendering path
                    if ((child as any).isSkinnedMesh) return
                    if (child.geometry) {
                      const key = `part-${i}-${partIndex}`
                      parts.push(
                        <mesh
                          key={key}
                          geometry={child.geometry}
                          matrixAutoUpdate={false}
                          ref={(m) => { meshRefs.current[key] = m; sourceRefs.current[key] = child }}
                          frustumCulled={false}
                          renderOrder={-1}
                        >
                          <meshBasicMaterial
                            color={color}
                            wireframe
                            transparent
                            opacity={0.35}
                            depthWrite={false}
                          />
                        </mesh>
                      )
                      partIndex++
                    }
                  }
                })

                if (parts.length > 0) return <group>{parts}</group>

                // fallback: rebase baked mesh by current * inverse(bakeMatrix)
                const key = `baked-${i}`
                return (
                  <mesh
                    key={key}
                    geometry={c.mesh.geometry}
                    matrixAutoUpdate={false}
                    ref={(m) => { meshRefs.current[key] = m; sourceRefs.current[key] = c }}
                    frustumCulled={false}
                    renderOrder={-1}
                  >
                    <meshBasicMaterial
                      color={color}
                      wireframe
                      transparent
                      opacity={0.35}
                      depthWrite={false}
                    />
                  </mesh>
                )
              } catch (e) {
                return null
              }
            })()}

            {showBoundingBoxes && c.boundingBox && (() => {
              // For animated colliders, transform the stored boundingBox by the source object's world matrix
              const size = new THREE.Vector3()
              const center = new THREE.Vector3()
              // If baked at a different matrix (bakeMatrix) and the object moved, rebase the baked box
              let box = c.boundingBox
              if (c.animated && c.sourceObject) {
                try {
                  const cloned = c.boundingBox.clone()
                  const current = c.sourceObject.matrixWorld
                  if ((c as any).bakeMatrix) {
                    const invBake = (c as any).bakeMatrix.clone().invert()
                    const transform = current.clone().multiply(invBake)
                    cloned.applyMatrix4(transform)
                  } else {
                    cloned.applyMatrix4(current)
                  }
                  box = cloned
                } catch (e) {
                  // fallback: use stored box
                  box = c.boundingBox
                }
              }
              box.getSize(size)
              box.getCenter(center)
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
