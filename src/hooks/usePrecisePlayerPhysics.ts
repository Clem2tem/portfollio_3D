import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import { usePreciseCollisions } from './usePreciseCollisions'

// === PARAMÈTRES AJUSTABLES ===
const GRAVITY = -9.81 * 1.5          // Force de gravité
const JUMP_FORCE = 6                  // Force du saut
const MOVE_SPEED = 4                  // Vitesse de déplacement
const GROUND_FRICTION = 0.98          // Friction au sol (plus proche de 1 = moins de friction)
const PLAYER_RADIUS = 0.3             // Rayon du joueur pour les collisions
const PLAYER_HEIGHT_OFFSET = -0.3      // **PARAMÈTRE PRINCIPAL** : Hauteur du joueur au-dessus du sol

export const usePrecisePlayerPhysics = () => {
  const velocity = useRef(new THREE.Vector3())
  const isGrounded = useRef(false)
  const { addPreciseCollisionObject, checkPreciseCollision, getGroundHeight, clearCollisions, collisionObjects } = usePreciseCollisions()

  const initializeCollisions = useCallback((objects: Array<{ object3D: THREE.Object3D; name: string }>) => {
    clearCollisions()
    objects.forEach(({ object3D, name }) => {
      addPreciseCollisionObject(name, object3D)
    })
    console.log(`Collisions simplifiées initialisées avec ${objects.length} objets`)
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

    // Mouvement horizontal simple et fluide
    if (inputVector.length() > 0) {
      const moveVel = inputVector.clone().normalize().multiplyScalar(MOVE_SPEED * deltaTime)
      
      // Test de collision précise
      const testPos = newPosition.clone().add(moveVel)
      // Ajuster la position de test pour être au centre du joueur
      testPos.y += PLAYER_RADIUS + 0.2 // Centrer la sphère de collision sur le modèle
      const collision = checkPreciseCollision(testPos, PLAYER_RADIUS)
      
      if (!collision.colliding) {
        newPosition.add(moveVel)
      }
    }

    // Mouvement vertical
    newPosition.y += velocity.current.y * deltaTime

    // Détection du sol avec position corrigée
    const groundTestPos = newPosition.clone()
    groundTestPos.y += PLAYER_RADIUS + 0.2 // Position du centre du joueur
    const groundY = getGroundHeight(groundTestPos)
    const targetY = groundY + PLAYER_RADIUS + PLAYER_HEIGHT_OFFSET
    
    if (newPosition.y <= targetY && velocity.current.y <= 0) {
      newPosition.y = targetY
      velocity.current.y = 0
      isGrounded.current = true
      
      // Friction légère seulement quand on ne bouge pas
      if (inputVector.length() === 0) {
        velocity.current.x *= GROUND_FRICTION
        velocity.current.z *= GROUND_FRICTION
      }
    } else {
      isGrounded.current = false
    }

    // Suppression des logs de debug pour les performances
    
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
