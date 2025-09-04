import { useCallback, useRef } from 'react'
import * as THREE from 'three'

interface CollisionObject {
  name: string
  boundingBox: THREE.Box3
  position: THREE.Vector3
}

export const useSimpleCollisions = () => {
  const collisionObjects = useRef<CollisionObject[]>([])

  const addCollisionObject = useCallback((name: string, object3D: THREE.Object3D) => {
    // Éviter les doublons
    const existingIndex = collisionObjects.current.findIndex(obj => obj.name === name)
    if (existingIndex !== -1) {
      collisionObjects.current.splice(existingIndex, 1)
    }

    const boundingBox = new THREE.Box3().setFromObject(object3D)
    const position = new THREE.Vector3()
    object3D.getWorldPosition(position)

    collisionObjects.current.push({
      name,
      boundingBox,
      position
    })

    console.log(`Collision ajoutée pour ${name}:`, {
      min: boundingBox.min,
      max: boundingBox.max,
      position
    })
  }, [])

  const checkCollision = useCallback((position: THREE.Vector3, radius: number = 0.5): boolean => {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(radius * 2, radius * 2, radius * 2)
    )

    for (const obj of collisionObjects.current) {
      if (playerBox.intersectsBox(obj.boundingBox)) {
        return true
      }
    }

    return false
  }, [])

  const getGroundHeight = useCallback((x: number, z: number): number => {
    // Pour l'île, on suppose une hauteur de base
    const islandObj = collisionObjects.current.find(obj => obj.name === 'island')
    if (islandObj) {
      const distance = Math.sqrt(x * x + z * z)
      // Si on est sur l'île (rayon approximatif de 8 unités)
      if (distance < 8) {
        return islandObj.boundingBox.max.y
      }
    }
    
    // Sinon, niveau de la mer
    return -10
  }, [])

  const clearCollisions = useCallback(() => {
    collisionObjects.current = []
  }, [])

  return {
    addCollisionObject,
    checkCollision,
    getGroundHeight,
    clearCollisions,
    collisionCount: collisionObjects.current.length,
    collisionObjects: collisionObjects.current
  }
}
