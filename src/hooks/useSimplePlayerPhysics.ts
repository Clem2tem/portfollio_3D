import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useSimpleCollisions } from './useSimpleCollisions'

const GRAVITY = -9.81 * 2
const JUMP_FORCE = 8
const MOVE_SPEED = 3
const GROUND_FRICTION = 0.9

export const useSimplePlayerPhysics = () => {
  const velocity = useRef(new THREE.Vector3())
  const isGrounded = useRef(false)
  const { addCollisionObject, checkCollision, getGroundHeight, clearCollisions, collisionObjects } = useSimpleCollisions()

  const initializeCollisions = useCallback((objects: Array<{ object3D: THREE.Object3D; name: string }>) => {
    clearCollisions()
    objects.forEach(({ object3D, name }) => {
      addCollisionObject(name, object3D)
    })
    console.log(`Collisions initialisées avec ${objects.length} objets`)
  }, [addCollisionObject, clearCollisions])

  const updatePhysics = useCallback((
    position: THREE.Vector3,
    deltaTime: number,
    inputVector: THREE.Vector3,
    shouldJump: boolean
  ): THREE.Vector3 => {
    const newPosition = position.clone()

    // Mouvement horizontal avec vérification de collision
    if (inputVector.length() > 0) {
      const moveVector = inputVector.clone().normalize().multiplyScalar(MOVE_SPEED * deltaTime)
      const testPosition = newPosition.clone().add(moveVector)
      
      // Vérifier collision horizontale
      if (!checkCollision(testPosition)) {
        newPosition.add(moveVector)
      }
    }

    // Gravité
    velocity.current.y += GRAVITY * deltaTime

    // Saut
    if (shouldJump && isGrounded.current) {
      velocity.current.y = JUMP_FORCE
      isGrounded.current = false
    }

    // Mouvement vertical
    const testY = newPosition.y + velocity.current.y * deltaTime
    const groundHeight = getGroundHeight(newPosition.x, newPosition.z)

    if (testY <= groundHeight + 0.5) {
      // Sur le sol
      newPosition.y = groundHeight + 0.5
      velocity.current.y = 0
      isGrounded.current = true
    } else {
      // En l'air
      newPosition.y = testY
      isGrounded.current = false
    }

    // Friction au sol
    if (isGrounded.current) {
      velocity.current.x *= GROUND_FRICTION
      velocity.current.z *= GROUND_FRICTION
    }

    return newPosition
  }, [checkCollision, getGroundHeight])

  return {
    updatePhysics,
    initializeCollisions,
    isGrounded: isGrounded.current,
    velocity: velocity.current,
    collisionObjects
  }
}
