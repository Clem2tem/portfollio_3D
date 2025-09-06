import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import { usePreciseCollisions } from './usePreciseCollisions'

// === PARAMÈTRES AJUSTABLES ===
const GRAVITY = -9.81 * 1.5           // Force de gravité
const JUMP_FORCE = 4                   // Force du saut
const MOVE_SPEED = 2                   // Vitesse de déplacement
const GROUND_FRICTION = 0.98           // Friction au sol (plus proche de 1 = moins de friction)
export const PLAYER_RADIUS = 0.11      // Rayon du joueur pour les collisions (position = pieds; centre sphère = y + R)
const PLAYER_HEIGHT_OFFSET = 0          // Hauteur du joueur au-dessus du sol
const MAX_SLOPE_DEG = 40               // Pente max montable (hors Island)
const MAX_STEP_UP = 0.1               // Hauteur max d'une marche
const MAX_STEP_DOWN = 0.5              // Descente max par frame
const EPS = 0                          // petite marge pour éviter l'oscillation et le survol

export const usePrecisePlayerPhysics = () => {
  const velocity = useRef(new THREE.Vector3())
  const isGrounded = useRef(false)
  const { addPreciseCollisionObject, checkPreciseCollision, getGroundHeight, clearCollisions, collisionObjects, getSupportBelow } = usePreciseCollisions()

  const initializeCollisions = useCallback((objects: Array<{ object3D: THREE.Object3D; name: string; animated?: boolean }>) => {
    clearCollisions()
    objects.forEach(({ object3D, name, animated }) => {
      addPreciseCollisionObject(name, object3D, { animated })
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
      const fullMove = inputVector.clone().normalize().multiplyScalar(MOVE_SPEED * deltaTime)
      const maxStepDist = Math.max(PLAYER_RADIUS * 0.5, 0.01)
      const steps = Math.max(1, Math.ceil(fullMove.length() / maxStepDist))
      const stepVec = fullMove.clone().multiplyScalar(1 / steps)

      for (let s = 0; s < steps; s++) {
        // 1) essai direct
        const candidate = newPosition.clone().add(stepVec)
        const testCenter = candidate.clone(); testCenter.y += PLAYER_RADIUS
        const hit = checkPreciseCollision(testCenter, PLAYER_RADIUS)

        if (hit.colliding) {
          // 2) tentative de step-up sur sous-pas
          const support = getSupportBelow(
            new THREE.Vector3(candidate.x, newPosition.y, candidate.z),
            { maxStepUp: MAX_STEP_UP, maxStepDown: 0, maxSlopeDeg: MAX_SLOPE_DEG, includeIsland: false }
          )
          let advanced = false
          if (Number.isFinite(support.y) && support.y !== -Infinity) {
            const stepY = support.y + PLAYER_HEIGHT_OFFSET + EPS
            if (stepY > newPosition.y && stepY - newPosition.y <= MAX_STEP_UP + 1e-4) {
              const stepped = new THREE.Vector3(candidate.x, stepY, candidate.z)
              const stepCenter = stepped.clone(); stepCenter.y += PLAYER_RADIUS
              const clearance = checkPreciseCollision(stepCenter, PLAYER_RADIUS)
              if (!clearance.colliding) {
                newPosition.copy(stepped)
                advanced = true
              }
            }
          }
          if (advanced) continue

          // 3) slide le long du mur pour ce sous-pas
          const n = hit.normal.clone().setY(0).normalize()
          if (n.lengthSq() > 1e-6) {
            const along = stepVec.clone().sub(n.multiplyScalar(stepVec.dot(n)))
            const alt = newPosition.clone().add(along)
            const altCenter = alt.clone(); altCenter.y += PLAYER_RADIUS
            const col2 = checkPreciseCollision(altCenter, PLAYER_RADIUS)
            if (!col2.colliding) {
              newPosition.copy(alt)
              continue
            }
          }

          // 4) dernière option: résolution par poussée hors de la géométrie
          const resolvedCenter = testCenter.clone().addScaledVector(hit.normal, hit.penetration + EPS)
          const resolvedFeet = resolvedCenter.clone(); resolvedFeet.y -= PLAYER_RADIUS
          newPosition.copy(resolvedFeet)
          // ne pas avancer davantage ce sous-pas
        } else {
          newPosition.copy(candidate)
        }
      }
    }

    // Mouvement vertical
    newPosition.y += velocity.current.y * deltaTime

    // --- Ceiling / clearance check: prevent passing through surfaces above ---
    // check the sphere at the new center for upward collisions
    const centerAfter = newPosition.clone()
    centerAfter.y += PLAYER_RADIUS
    const upHit = checkPreciseCollision(centerAfter, PLAYER_RADIUS)
    if (upHit.colliding) {
      // If penetrating or moving up into a ceiling, push the sphere out along the hit normal
      // This moves the player's center away from the surface; feet are center.y - PLAYER_RADIUS
      const push = upHit.normal.clone().multiplyScalar(upHit.penetration + EPS)
      const resolvedCenter = centerAfter.clone().add(push)
      const resolvedFeetY = resolvedCenter.y - PLAYER_RADIUS
      // Only modify vertical position if this would lower the feet (i.e., stop upward motion)
      if (resolvedFeetY < newPosition.y + 1e-6) {
        newPosition.y = resolvedFeetY
      }
      // Cancel any upward velocity so we don't immediately re-penetrate
      if (velocity.current.y > 0) velocity.current.y = 0
    }

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
  // Place les PIEDS au niveau du support (plus un léger epsilon); le centre de la sphère est alors à y + PLAYER_RADIUS
  const targetY = targetSupportY + PLAYER_HEIGHT_OFFSET + EPS

    // Atterrissage / accrochage au sol si on descendz
    if (newPosition.y <= targetY + EPS && velocity.current.y <= 0) {
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
      // éviter de passer sous l'île: pieds >= islandY
      if (newPosition.y < (minGroundY + PLAYER_HEIGHT_OFFSET + EPS)) {
        newPosition.y = minGroundY + PLAYER_HEIGHT_OFFSET + EPS
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
