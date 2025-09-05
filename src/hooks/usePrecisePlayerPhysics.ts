import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import { usePreciseCollisions } from './usePreciseCollisions'

// === PARAMÈTRES AJUSTABLES ===
const GRAVITY = -9.81 * 1.5           // Force de gravité
const JUMP_FORCE = 4                   // Force du saut
const MOVE_SPEED = 2                   // Vitesse de déplacement
const GROUND_FRICTION = 0.98           // Friction au sol (plus proche de 1 = moins de friction)
const PLAYER_RADIUS = 0.01            // Rayon du joueur pour les collisions (plus large pour éviter les "aspirations" sur murs)
const PLAYER_HEIGHT_OFFSET = 0        // Hauteur du joueur au-dessus du sol
const MAX_SLOPE_DEG = 40               // Pente max montable (hors Island)
const MAX_STEP_UP = 0.05               // Hauteur max d'une marche
const MAX_STEP_DOWN = 0.5              // Descente max par frame

export const usePrecisePlayerPhysics = () => {
  const velocity = useRef(new THREE.Vector3())
  const isGrounded = useRef(false)
  const { addPreciseCollisionObject, checkPreciseCollision, getGroundHeight, clearCollisions, collisionObjects, getSupportBelow } = usePreciseCollisions()

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

    // Mouvement horizontal avec test de collision et stepping
    if (inputVector.length() > 0) {
      const moveVel = inputVector.clone().normalize().multiplyScalar(MOVE_SPEED * deltaTime)

      // 1) essai direct
      let candidate = newPosition.clone().add(moveVel)
      const testCenter = candidate.clone(); testCenter.y += PLAYER_RADIUS + 0.2
      const hit = checkPreciseCollision(testCenter, PLAYER_RADIUS)

      if (hit.colliding) {
        // 2) tentative de step-up: uniquement si une surface walkable est trouvée dans la fenêtre de step ET qu'il y a de la place à cette hauteur
        const support = getSupportBelow(
          new THREE.Vector3(candidate.x, newPosition.y, candidate.z),
          { maxStepUp: MAX_STEP_UP, maxStepDown: 0, maxSlopeDeg: MAX_SLOPE_DEG, includeIsland: false }
        )
        if (Number.isFinite(support.y) && support.y !== -Infinity) {
          const stepY = support.y + PLAYER_RADIUS + PLAYER_HEIGHT_OFFSET
          if (stepY > newPosition.y && stepY - newPosition.y <= MAX_STEP_UP + 1e-4) {
            // re-tester la collision au niveau relevé (évite d'être "poussé" sur un mur)
            const stepped = new THREE.Vector3(candidate.x, stepY, candidate.z)
            const stepCenter = stepped.clone(); stepCenter.y += PLAYER_RADIUS + 0.05
            const clearance = checkPreciseCollision(stepCenter, PLAYER_RADIUS)
            if (!clearance.colliding) {
              newPosition.copy(stepped)
            }
          }
        }
        // 3) sinon: slide le long du mur en annulant la composante vers l'obstacle
        if (newPosition.equals(position)) {
          const n = hit.normal.clone().setY(0).normalize()
          if (n.lengthSq() > 1e-6) {
            const along = moveVel.clone().sub(n.multiplyScalar(moveVel.dot(n)))
            const alt = position.clone().add(along)
            const altCenter = alt.clone(); altCenter.y += PLAYER_RADIUS + 0.2
            const col2 = checkPreciseCollision(altCenter, PLAYER_RADIUS)
            if (!col2.colliding) newPosition.copy(alt)
          }
        }
      } else {
        newPosition.copy(candidate)
      }
    }

    // Mouvement vertical
    newPosition.y += velocity.current.y * deltaTime

    // Détection du support: surfaces walkables (hors Island) puis Island comme minimum
    const support = getSupportBelow(
      newPosition.clone(),
      { maxStepUp: MAX_STEP_UP, maxStepDown: MAX_STEP_DOWN, maxSlopeDeg: MAX_SLOPE_DEG, includeIsland: false }
    )

    // Island minimum: assure rester au-dessus de l'île même hors autres supports
    const islandY = getGroundHeight(newPosition.clone())
    const minGroundY = Number.isFinite(islandY) ? islandY : -Infinity

    // Le support prioritaire est celui non-Island s'il existe et est au-dessus de l'île; sinon on colle à l'île
    const targetSupportY = (support.y !== -Infinity) ? Math.max(support.y, minGroundY) : minGroundY
    const targetY = targetSupportY + PLAYER_RADIUS + PLAYER_HEIGHT_OFFSET

    // Atterrissage / accrochage au sol si on descend
    if (newPosition.y <= targetY + 1e-4 && velocity.current.y <= 0) {
      newPosition.y = targetY
      velocity.current.y = 0
      isGrounded.current = true
      if (inputVector.length() === 0) {
        velocity.current.x *= GROUND_FRICTION
        velocity.current.z *= GROUND_FRICTION
      }
    } else {
      // si on est au-dessus mais qu'on a quitté un support, on peut tomber jusqu'à Island ou autre
      isGrounded.current = false
      // éviter de passer sous l'île si on tombe plus bas que min island Y
      if (newPosition.y < (minGroundY + PLAYER_RADIUS + PLAYER_HEIGHT_OFFSET)) {
        newPosition.y = minGroundY + PLAYER_RADIUS + PLAYER_HEIGHT_OFFSET
        velocity.current.y = Math.max(0, velocity.current.y)
        isGrounded.current = true
      }
    }

    // Suppression des logs de debug pour les performances
    
    return newPosition
  }, [checkPreciseCollision, getGroundHeight, getSupportBelow])

  return {
    updatePhysics,
    initializeCollisions,
    isGrounded: isGrounded.current,
    velocity: velocity.current,
    collisionObjects
  }
}
