import React from 'react'
import * as THREE from 'three'

interface HitboxVisualizerProps {
  visible: boolean
  playerPosition: THREE.Vector3
  playerRadius?: number
  playerHeight?: number
  collisionObjects?: Array<{
    name: string
    boundingBox?: THREE.Box3
    position?: THREE.Vector3
    meshes?: THREE.Mesh[] // Pour les collisions précises
  }>
  preciseMode?: boolean // Nouveau prop pour basculer entre boîtes et meshes précis
}

export const HitboxVisualizer: React.FC<HitboxVisualizerProps> = ({
  visible,
  playerPosition,
  playerRadius = 0.3,
  collisionObjects = [],
  preciseMode = false
}) => {
  if (!visible) return null

  return (
    <group>
      {/* Hitbox du joueur - Sphère plus réaliste */}
      <mesh position={[playerPosition.x, playerPosition.y + playerRadius, playerPosition.z]}>
        <sphereGeometry args={[playerRadius, 16, 16]} />
        <meshBasicMaterial
          color="green"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Hitboxes des objets de collision */}
      {collisionObjects.map((obj, index) => {
        // Couleur différente selon le type d'objet
        let color = "red"
        if (obj.name?.toLowerCase().includes('island')) {
          color = "blue"
        } else if (obj.name?.toLowerCase().includes('hospital') || obj.name?.toLowerCase().includes('chu')) {
          color = "yellow"
        } else if (obj.name?.toLowerCase().includes('excavator')) {
          color = "orange"
        }

        if (preciseMode && obj.meshes) {
          // Mode précis - Afficher les vrais meshes avec transformations
          return (
            <group key={`precise-${obj.name}-${index}`}>
              {obj.meshes.map((mesh, meshIndex) => {
                // Obtenir les transformations du mesh original
                mesh.updateMatrixWorld()
                const position = new THREE.Vector3()
                const quaternion = new THREE.Quaternion()
                const scale = new THREE.Vector3()
                mesh.matrixWorld.decompose(position, quaternion, scale)

                // Cloner la géométrie pour l'affichage wireframe
                const geometry = mesh.geometry.clone()

                return (
                  <mesh
                    key={`mesh-${meshIndex}`}
                    position={[position.x, position.y, position.z]}
                    quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}
                    scale={[scale.x, scale.y, scale.z]}
                  >
                    <primitive object={geometry} />
                    <meshBasicMaterial
                      color={color}
                      wireframe
                      transparent
                      opacity={0.3}
                    />
                  </mesh>
                )
              })}
              
              {/* Label avec le nom de l'objet */}
              {obj.boundingBox && (
                <mesh position={(() => {
                  const center = obj.boundingBox.getCenter(new THREE.Vector3())
                  const size = obj.boundingBox.getSize(new THREE.Vector3())
                  return [center.x, center.y + size.y / 2 + 0.5, center.z]
                })()}>
                  <planeGeometry args={[2, 0.5]} />
                  <meshBasicMaterial
                    color="white"
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              )}
            </group>
          )
        } else if (obj.boundingBox) {
          // Mode simple - Afficher les boîtes englobantes
          const size = obj.boundingBox.getSize(new THREE.Vector3())
          const center = obj.boundingBox.getCenter(new THREE.Vector3())
          
          return (
            <group key={`simple-${obj.name}-${index}`}>
              {/* Wireframe de la boîte de collision */}
              <mesh position={[center.x, center.y, center.z]}>
                <boxGeometry args={[size.x, size.y, size.z]} />
                <meshBasicMaterial
                  color={color}
                  wireframe
                  transparent
                  opacity={0.3}
                />
              </mesh>
              
              {/* Label avec le nom de l'objet */}
              <mesh position={[center.x, center.y + size.y / 2 + 0.5, center.z]}>
                <planeGeometry args={[2, 0.5]} />
                <meshBasicMaterial
                  color="white"
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
          )
        }

        return null
      })}
    </group>
  )
}
