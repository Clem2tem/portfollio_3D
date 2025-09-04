import { useRef } from 'react'
import * as THREE from 'three'

export interface CollisionObject {
  position: THREE.Vector3
  size: THREE.Vector3
  type: 'box' | 'cylinder' | 'sphere'
  radius?: number // pour les sphères et cylindres
  height?: number // pour les cylindres
}

export interface PlayerPhysicsState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  onGround: boolean
  isJumping: boolean
}

// Function to generate collision objects from project data
export const generateProjectCollisions = (projects: any[]): CollisionObject[] => {
  return projects.map(project => {
    const pos = new THREE.Vector3(...project.position)
    
    switch (project.buildingType) {
      case 'hospital':
        return {
          position: pos,
          size: new THREE.Vector3(1.2, 2, 1.2), // Larger for hospital model
          type: 'box' as const
        }
      case 'office':
        return {
          position: pos,
          size: new THREE.Vector3(0.8, 1.8, 0.8),
          type: 'box' as const
        }
      case 'school':
        return {
          position: pos,
          size: new THREE.Vector3(1.2, 1.2, 1),
          type: 'box' as const
        }
      case 'factory':
        return {
          position: pos,
          size: new THREE.Vector3(1.5, 1.5, 1.5), // Larger for excavator
          type: 'box' as const
        }
      default:
        return {
          position: pos,
          size: new THREE.Vector3(1, 1.2, 1),
          type: 'box' as const
        }
    }
  })
}

export const usePlayerPhysics = (projects: any[] = []) => {
  const physicsState = useRef<PlayerPhysicsState>({
    position: new THREE.Vector3(0, 1, 1),
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: false,
    isJumping: false
  })

  // Paramètres physiques
  const GRAVITY = -12
  const JUMP_FORCE = 7
  const GROUND_FRICTION = 0.8
  const AIR_RESISTANCE = 0.95
  const MIN_GROUND_Y = 0.1
  const COLLISION_MARGIN = 0.1
  const PLAYER_HEIGHT = 1.0
  const PLAYER_RADIUS = 0.3

  // Liste des objets de collision - redessinée avec de meilleures dimensions
  const collisionObjects = useRef<CollisionObject[]>([
    // Île principale - forme plus réaliste
    {
      position: new THREE.Vector3(0, -0.5, 0),
      size: new THREE.Vector3(12, 1, 12), // Plus large pour correspondre à l'île visuelle
      type: 'cylinder',
      radius: 6.5, // Rayon plus précis
      height: 1
    },
    // Arbres autour de l'île - repositionnés selon l'île réelle
    ...Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2 + (0.5 - Math.random()) * 0.3
      const radius = 5.2 + Math.random() * 1.2 // Adjusted to island size
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      return {
        position: new THREE.Vector3(x, 0.5, z),
        size: new THREE.Vector3(0.5, 2, 0.5),
        type: 'cylinder' as const,
        radius: 0.25,
        height: 2
      }
    }),
    // Ajouter les collisions des projets
    ...generateProjectCollisions(projects)
  ])

  // Fonction de collision améliorée - collision capsule vs différentes formes
  const checkCapsuleCollision = (
    capsuleStart: THREE.Vector3,
    capsuleEnd: THREE.Vector3,
    capsuleRadius: number,
    obj: CollisionObject
  ): { colliding: boolean; normal: THREE.Vector3; penetration: number; point: THREE.Vector3 } => {
    const result = {
      colliding: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      point: new THREE.Vector3()
    }

    switch (obj.type) {
      case 'box': {
        // Collision capsule vs box - algorithme simplifié mais plus robuste
        const boxMin = obj.position.clone().sub(obj.size.clone().multiplyScalar(0.5))
        const boxMax = obj.position.clone().add(obj.size.clone().multiplyScalar(0.5))
        
        // Point le plus proche sur la capsule au centre de la boîte
        const capsuleDir = capsuleEnd.clone().sub(capsuleStart).normalize()
        const toBox = obj.position.clone().sub(capsuleStart)
        const t = Math.max(0, Math.min(1, toBox.dot(capsuleDir)))
        const closestPointOnCapsule = capsuleStart.clone().addScaledVector(capsuleDir, t * capsuleStart.distanceTo(capsuleEnd))
        
        // Point le plus proche sur la boîte
        const closestPointOnBox = new THREE.Vector3(
          Math.max(boxMin.x, Math.min(boxMax.x, closestPointOnCapsule.x)),
          Math.max(boxMin.y, Math.min(boxMax.y, closestPointOnCapsule.y)),
          Math.max(boxMin.z, Math.min(boxMax.z, closestPointOnCapsule.z))
        )
        
        const distance = closestPointOnCapsule.distanceTo(closestPointOnBox)
        
        if (distance < capsuleRadius) {
          result.colliding = true
          result.penetration = capsuleRadius - distance
          result.normal = closestPointOnCapsule.clone().sub(closestPointOnBox).normalize()
          if (result.normal.lengthSq() === 0) {
            result.normal.set(0, 1, 0) // Fallback normal
          }
          result.point = closestPointOnBox
        }
        break
      }

      case 'cylinder': {
        // Collision capsule vs cylindre
        const cylinderRadius = obj.radius || obj.size.x * 0.5
        const cylinderHeight = obj.height || obj.size.y
        const cylinderTop = obj.position.y + cylinderHeight * 0.5
        const cylinderBottom = obj.position.y - cylinderHeight * 0.5
        
        // Projeter la capsule sur le plan XZ
        const capsuleStartXZ = new THREE.Vector2(capsuleStart.x, capsuleStart.z)
        const capsuleEndXZ = new THREE.Vector2(capsuleEnd.x, capsuleEnd.z)
        const cylinderCenterXZ = new THREE.Vector2(obj.position.x, obj.position.z)
        
        // Distance entre la ligne de la capsule et le centre du cylindre en XZ
        const capsuleLineXZ = capsuleEndXZ.clone().sub(capsuleStartXZ)
        const toCylinderXZ = cylinderCenterXZ.clone().sub(capsuleStartXZ)
        
        let t = 0
        if (capsuleLineXZ.lengthSq() > 0) {
          t = Math.max(0, Math.min(1, toCylinderXZ.dot(capsuleLineXZ) / capsuleLineXZ.lengthSq()))
        }
        
        const closestPointXZ = capsuleStartXZ.clone().addScaledVector(capsuleLineXZ, t)
        const distanceXZ = closestPointXZ.distanceTo(cylinderCenterXZ)
        
        // Vérifier la distance horizontale
        if (distanceXZ < cylinderRadius + capsuleRadius) {
          // Vérifier la hauteur
          const capsuleY = capsuleStart.y + t * (capsuleEnd.y - capsuleStart.y)
          
          if (capsuleY + capsuleRadius > cylinderBottom && capsuleY - capsuleRadius < cylinderTop) {
            result.colliding = true
            
            // Calculer la normale et la pénétration
            if (distanceXZ > 0) {
              const normalXZ = closestPointXZ.clone().sub(cylinderCenterXZ).normalize()
              result.normal.set(normalXZ.x, 0, normalXZ.y)
              result.penetration = (cylinderRadius + capsuleRadius) - distanceXZ
            } else {
              // Cas où on est exactement au centre
              result.normal.set(1, 0, 0)
              result.penetration = cylinderRadius + capsuleRadius
            }
            
            result.point.set(closestPointXZ.x, capsuleY, closestPointXZ.y)
          }
        }
        break
      }

      case 'sphere': {
        // Collision capsule vs sphère
        const sphereRadius = obj.radius || obj.size.x * 0.5
        const capsuleDir = capsuleEnd.clone().sub(capsuleStart)
        const capsuleLength = capsuleDir.length()
        
        if (capsuleLength > 0) {
          capsuleDir.normalize()
          const toSphere = obj.position.clone().sub(capsuleStart)
          const t = Math.max(0, Math.min(capsuleLength, toSphere.dot(capsuleDir)))
          const closestPoint = capsuleStart.clone().addScaledVector(capsuleDir, t)
          
          const distance = closestPoint.distanceTo(obj.position)
          const totalRadius = sphereRadius + capsuleRadius
          
          if (distance < totalRadius) {
            result.colliding = true
            result.penetration = totalRadius - distance
            result.normal = closestPoint.clone().sub(obj.position).normalize()
            if (result.normal.lengthSq() === 0) {
              result.normal.set(0, 1, 0)
            }
            result.point = closestPoint
          }
        }
        break
      }
    }

    return result
  }

  // Vérification du sol améliorée
  const checkGroundCollision = (position: THREE.Vector3): { onGround: boolean; groundY: number } => {
    let onGround = false
    let groundY = MIN_GROUND_Y

    // Vérifier si on est sur l'île principale
    const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z)
    if (distanceFromCenter <= 6.5) { // Rayon de l'île
      groundY = MIN_GROUND_Y
      // Raycast vers le bas pour détecter le sol
      onGround = position.y <= groundY + COLLISION_MARGIN * 2
    }

    return { onGround, groundY }
  }

  // Mise à jour de la physique
  const updatePhysics = (delta: number, inputVector: THREE.Vector3, jumpPressed: boolean) => {
    const state = physicsState.current
    const newPosition = state.position.clone()
    const newVelocity = state.velocity.clone()

    // Appliquer la gravité
    if (!state.onGround) {
      newVelocity.y += GRAVITY * delta
    }

    // Gestion du saut
    if (jumpPressed && state.onGround && !state.isJumping) {
      newVelocity.y = JUMP_FORCE
      state.isJumping = true
      state.onGround = false
    }

    // Appliquer les forces de mouvement horizontal
    if (inputVector.lengthSq() > 0) {
      const acceleration = 15 // Accélération plus responsive
      newVelocity.x += inputVector.x * acceleration * delta
      newVelocity.z += inputVector.z * acceleration * delta
      
      // Limiter la vitesse horizontale
      const maxHorizontalSpeed = 4
      const horizontalVel = new THREE.Vector3(newVelocity.x, 0, newVelocity.z)
      if (horizontalVel.length() > maxHorizontalSpeed) {
        horizontalVel.normalize().multiplyScalar(maxHorizontalSpeed)
        newVelocity.x = horizontalVel.x
        newVelocity.z = horizontalVel.z
      }
    }

    // Appliquer la friction/résistance
    if (state.onGround) {
      newVelocity.x *= GROUND_FRICTION
      newVelocity.z *= GROUND_FRICTION
      // Stabiliser la vitesse verticale au sol
      if (Math.abs(newVelocity.y) < 0.1) {
        newVelocity.y = 0
      }
    } else {
      newVelocity.x *= AIR_RESISTANCE
      newVelocity.z *= AIR_RESISTANCE
    }

    // Calculer la nouvelle position avec des étapes plus petites pour éviter la traversée
    const steps = Math.max(1, Math.ceil(newVelocity.length() * delta / 0.1)) // Subdivision adaptative
    const stepDelta = delta / steps
    let resolvedPosition = newPosition.clone()
    let resolvedVelocity = newVelocity.clone()

    for (let step = 0; step < steps; step++) {
      const stepVelocity = resolvedVelocity.clone().multiplyScalar(stepDelta)
      const testPosition = resolvedPosition.clone().add(stepVelocity)
      
      // Représenter le joueur comme une capsule
      const capsuleBottom = testPosition.clone()
      const capsuleTop = testPosition.clone().add(new THREE.Vector3(0, PLAYER_HEIGHT, 0))
      
      let hasCollision = false
      
      // Vérifier collision avec tous les objets
      for (const obj of collisionObjects.current) {
        const collision = checkCapsuleCollision(capsuleBottom, capsuleTop, PLAYER_RADIUS, obj)
        
        if (collision.colliding) {
          hasCollision = true
          
          // Résoudre la collision
          const correction = collision.normal.clone().multiplyScalar(collision.penetration + COLLISION_MARGIN)
          testPosition.add(correction)
          
          // Ajuster la vitesse
          const velDotNormal = resolvedVelocity.dot(collision.normal)
          if (velDotNormal < 0) {
            resolvedVelocity.sub(collision.normal.clone().multiplyScalar(velDotNormal))
          }
          
          // Si collision verticale vers le bas, considérer comme sol
          if (collision.normal.y > 0.7 && resolvedVelocity.y <= 0) {
            state.onGround = true
            state.isJumping = false
            resolvedVelocity.y = 0
          }
        }
      }
      
      resolvedPosition.copy(testPosition)
      
      // Arrêter si collision détectée pour éviter les oscillations
      if (hasCollision) break
    }

    // Vérifier collision avec le sol de l'île
    const groundCheck = checkGroundCollision(resolvedPosition)
    if (groundCheck.onGround && resolvedPosition.y <= groundCheck.groundY + COLLISION_MARGIN) {
      resolvedPosition.y = groundCheck.groundY + COLLISION_MARGIN
      if (resolvedVelocity.y <= 0) {
        resolvedVelocity.y = 0
        state.onGround = true
        state.isJumping = false
      }
    }

    // Empêcher de sortir de l'île (limites invisibles)
    const distanceFromCenter = Math.sqrt(resolvedPosition.x * resolvedPosition.x + resolvedPosition.z * resolvedPosition.z)
    if (distanceFromCenter > 7) {
      const direction = new THREE.Vector3(resolvedPosition.x, 0, resolvedPosition.z).normalize()
      resolvedPosition.x = direction.x * 7
      resolvedPosition.z = direction.z * 7
      // Arrêter le mouvement vers l'extérieur
      if (resolvedVelocity.dot(direction) > 0) {
        resolvedVelocity.sub(direction.clone().multiplyScalar(resolvedVelocity.dot(direction)))
      }
    }

    // Empêcher de tomber sous la carte
    if (resolvedPosition.y < -10) {
      resolvedPosition.set(0, 2, 1) // Respawn au centre
      resolvedVelocity.set(0, 0, 0)
      state.onGround = false
    }

    // Mettre à jour l'état
    state.position.copy(resolvedPosition)
    state.velocity.copy(resolvedVelocity)

    return {
      position: resolvedPosition,
      velocity: resolvedVelocity,
      onGround: state.onGround,
      isJumping: state.isJumping
    }
  }

  // Fonction pour ajouter un objet de collision dynamiquement
  const addCollisionObject = (obj: CollisionObject) => {
    collisionObjects.current.push(obj)
  }

  // Fonction pour supprimer un objet de collision
  const removeCollisionObject = (index: number) => {
    collisionObjects.current.splice(index, 1)
  }

  return {
    physicsState: physicsState.current,
    updatePhysics,
    addCollisionObject,
    removeCollisionObject,
    collisionObjects: collisionObjects.current
  }
}
