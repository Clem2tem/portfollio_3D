import { useRef } from 'react'
import * as THREE from 'three'
import { useCollisionFromGLTF } from './useCollisionFromGLTF'

export interface PlayerPhysicsState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  onGround: boolean
  isJumping: boolean
}

export const usePlayerPhysicsWithGLTF = () => {
  const physicsState = useRef<PlayerPhysicsState>({
    position: new THREE.Vector3(0, 2, 1), // Start a bit higher
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: false,
    isJumping: false
  })

  const collisionSystem = useCollisionFromGLTF()

  // Paramètres physiques
  const GRAVITY = -12
  const JUMP_FORCE = 7
  const GROUND_FRICTION = 0.8
  const AIR_RESISTANCE = 0.95
  const COLLISION_MARGIN = 0.1
  const PLAYER_HEIGHT = 1.0
  const PLAYER_RADIUS = 0.3

  // Fonction pour initialiser les collisions avec les vrais objets GLTF de la scène
  const initializeCollisions = (gltfObjects: Array<{
    object3D: THREE.Object3D,
    name: string
  }>) => {
    collisionSystem.clearCollisions()
    
    gltfObjects.forEach(({ object3D, name }) => {
      collisionSystem.addGLTFCollision(object3D, name)
    })
    
    console.log(`Initialized collisions with ${gltfObjects.length} GLTF objects`)
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
      const acceleration = 15
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
      if (Math.abs(newVelocity.y) < 0.1) {
        newVelocity.y = 0
      }
    } else {
      newVelocity.x *= AIR_RESISTANCE
      newVelocity.z *= AIR_RESISTANCE
    }

    // Calculer la nouvelle position avec subdivision pour éviter la traversée
    const steps = Math.max(1, Math.ceil(newVelocity.length() * delta / 0.1))
    const stepDelta = delta / steps
    let resolvedPosition = newPosition.clone()
    let resolvedVelocity = newVelocity.clone()

    for (let step = 0; step < steps; step++) {
      const stepVelocity = resolvedVelocity.clone().multiplyScalar(stepDelta)
      const testPosition = resolvedPosition.clone().add(stepVelocity)
      
      // Vérifier collision avec les objets GLTF
      const collision = collisionSystem.checkCollisionWithPoint(testPosition, PLAYER_RADIUS, PLAYER_HEIGHT)
      
      if (collision.colliding) {
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
        
        // Arrêter les iterations si collision pour éviter les oscillations
        resolvedPosition.copy(testPosition)
        break
      }
      
      resolvedPosition.copy(testPosition)
    }

    // Vérifier collision avec le sol (île)
    const groundCheck = collisionSystem.checkGroundCollision(resolvedPosition)
    if (groundCheck.onGround && resolvedPosition.y <= groundCheck.groundY + COLLISION_MARGIN) {
      resolvedPosition.y = groundCheck.groundY + COLLISION_MARGIN
      if (resolvedVelocity.y <= 0) {
        resolvedVelocity.y = 0
        state.onGround = true
        state.isJumping = false
      }
    }

    // Limites de l'île (fallback si pas de collision détectée)
    const distanceFromCenter = Math.sqrt(resolvedPosition.x * resolvedPosition.x + resolvedPosition.z * resolvedPosition.z)
    if (distanceFromCenter > 8) {
      const direction = new THREE.Vector3(resolvedPosition.x, 0, resolvedPosition.z).normalize()
      resolvedPosition.x = direction.x * 8
      resolvedPosition.z = direction.z * 8
      if (resolvedVelocity.dot(direction) > 0) {
        resolvedVelocity.sub(direction.clone().multiplyScalar(resolvedVelocity.dot(direction)))
      }
    }

    // Empêcher de tomber sous la carte
    if (resolvedPosition.y < -10) {
      resolvedPosition.set(0, 3, 1)
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

  return {
    physicsState: physicsState.current,
    updatePhysics,
    initializeCollisions,
    collisionSystem
  }
}
