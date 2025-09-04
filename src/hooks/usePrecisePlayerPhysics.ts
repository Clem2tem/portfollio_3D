import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import { usePreciseCollisions } from './usePreciseCollisions'

const GRAVITY = -9.81 * 2
const JUMP_FORCE = 8
const MOVE_SPEED = 3
const GROUND_FRICTION = 0.9
const PLAYER_RADIUS = 0.3

export const usePrecisePlayerPhysics = () => {
  const velocity = useRef(new THREE.Vector3())
  const isGrounded = useRef(false)
  const { addPreciseCollisionObject, checkPreciseCollision, getGroundHeight, clearCollisions, collisionObjects } = usePreciseCollisions()

  const initializeCollisions = useCallback((objects: Array<{ object3D: THREE.Object3D; name: string }>) => {
    clearCollisions()
    objects.forEach(({ object3D, name }) => {
      addPreciseCollisionObject(name, object3D)
    })
    console.log(`Collisions précises initialisées avec ${objects.length} objets`)
  }, [addPreciseCollisionObject, clearCollisions])

  const updatePhysics = useCallback((
    position: THREE.Vector3,
    deltaTime: number,
    inputVector: THREE.Vector3,
    shouldJump: boolean
  ): THREE.Vector3 => {
    const newPosition = position.clone()

    // Appliquer la gravité
    velocity.current.y += GRAVITY * deltaTime

    // Gestion du saut
    if (shouldJump && isGrounded.current) {
      velocity.current.y = JUMP_FORCE
      isGrounded.current = false
    }

    // Appliquer le mouvement horizontal
    if (inputVector.length() > 0) {
      const moveVel = inputVector.clone().normalize().multiplyScalar(MOVE_SPEED * deltaTime)
      
      // Test de collision horizontale
      const testPos = newPosition.clone().add(moveVel)
      const horizontalCollision = checkPreciseCollision(testPos, PLAYER_RADIUS)
      
      if (!horizontalCollision.colliding) {
        newPosition.add(moveVel)
      } else {
        // Glissement le long des surfaces
        const slideDirection = inputVector.clone().projectOnPlane(horizontalCollision.normal)
        const slideMove = slideDirection.normalize().multiplyScalar(MOVE_SPEED * deltaTime * 0.5)
        const slideTestPos = newPosition.clone().add(slideMove)
        
        if (!checkPreciseCollision(slideTestPos, PLAYER_RADIUS).colliding) {
          newPosition.add(slideMove)
        }
      }
    }

    // Appliquer la vélocité verticale
    newPosition.y += velocity.current.y * deltaTime

    // Détection du sol précise
    const groundY = getGroundHeight(newPosition)
    const minY = groundY + PLAYER_RADIUS

    if (newPosition.y <= minY) {
      newPosition.y = minY
      velocity.current.y = 0
      isGrounded.current = true
      
      // Friction au sol
      velocity.current.x *= GROUND_FRICTION
      velocity.current.z *= GROUND_FRICTION
    } else {
      isGrounded.current = false
    }

    // Test de collision verticale (plafond)
    const ceilingCollision = checkPreciseCollision(newPosition, PLAYER_RADIUS)
    if (ceilingCollision.colliding && velocity.current.y > 0) {
      velocity.current.y = 0
    }

    return newPosition
  }, [checkPreciseCollision, getGroundHeight])

  return {
    updatePhysics,
    initializeCollisions,
    isGrounded: isGrounded.current,
    velocity: velocity.current,
    collisionObjects
  }
}
