import React from 'react'
import * as THREE from 'three'

interface HitboxVisualizerProps {
  visible: boolean
  playerPosition: THREE.Vector3
  playerRadius?: number
  collisionObjects?: Array<{
    name: string
    boundingBox?: THREE.Box3
    meshPoints?: THREE.Vector3[]
    usePreciseCollision?: boolean
  }>
}

export const HitboxVisualizer: React.FC<HitboxVisualizerProps> = ({
  visible,
  playerPosition,
  playerRadius = 0.3,
  collisionObjects = []
}) => {
  if (!visible) return null

  return (
    <group>
      {/* Hitbox du joueur - Sphère ajustée pour être centrée sur le modèle */}
      <mesh position={[playerPosition.x, playerPosition.y + playerRadius, playerPosition.z]}>
        <sphereGeometry args={[playerRadius, 8, 8]} />
        <meshBasicMaterial
          color="green"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Hitboxes des objets */}
      {collisionObjects.map((obj, index) => {
        if (!obj.boundingBox) return null

        // Couleur selon le type d'objet
        let color = "red"
        if (obj.name?.toLowerCase().includes('island')) {
          color = "blue"
        } else if (obj.name?.toLowerCase().includes('hospital') || obj.name?.toLowerCase().includes('chu')) {
          color = "yellow"
        } else if (obj.name?.toLowerCase().includes('excavator')) {
          color = "orange"
        }

        return (
          <group key={`hitbox-${obj.name}-${index}`}>
            {obj.usePreciseCollision ? (
              // Affichage précis pour l'île
              obj.meshPoints && obj.meshPoints.length > 0 && (
                <group>
                  {/* Échantillonner les points pour éviter trop d'affichage */}
                  {obj.meshPoints.filter((_, pointIdx) => pointIdx % 8 === 0).map((point, pointIndex) => (
                    <mesh 
                      key={`mesh-point-${index}-${pointIndex}`}
                      position={[point.x, point.y, point.z]}
                    >
                      <sphereGeometry args={[0.01, 4, 4]} />
                      <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.6}
                      />
                    </mesh>
                  ))}
                </group>
              )
            ) : (
              // Bounding box simple pour les autres objets
              obj.boundingBox && (() => {
                const size = obj.boundingBox.getSize(new THREE.Vector3())
                const center = obj.boundingBox.getCenter(new THREE.Vector3())
                return (
                  <mesh position={[center.x, center.y, center.z]}>
                    <boxGeometry args={[size.x, size.y, size.z]} />
                    <meshBasicMaterial
                      color={color}
                      wireframe
                      transparent
                      opacity={0.3}
                    />
                  </mesh>
                )
              })()
            )}
          </group>
        )
      })}
    </group>
  )
}
