import { useRef } from 'react'
import * as THREE from 'three'

export interface GLTFCollisionObject {
  boundingBox: THREE.Box3
  name: string
  object3D: THREE.Object3D
}

export const useCollisionFromGLTF = () => {
  const collisionObjects = useRef<GLTFCollisionObject[]>([])

  // Fonction pour ajouter un modèle GLTF comme objet de collision
  const addGLTFCollision = (
    object3D: THREE.Object3D,
    name: string = 'unnamed'
  ) => {
    // Calculer la boîte englobante du modèle 3D réel
    const boundingBox = new THREE.Box3().setFromObject(object3D)
    
    collisionObjects.current.push({
      boundingBox,
      name,
      object3D
    })
    
    console.log(`Added GLTF collision for ${name}:`, boundingBox)
  }

  // Fonction pour vérifier collision avec un point (position du joueur)
  const checkCollisionWithPoint = (
    point: THREE.Vector3,
    playerRadius: number = 0.3,
    playerHeight: number = 1.0
  ): { 
    colliding: boolean; 
    normal: THREE.Vector3; 
    penetration: number; 
    objectName?: string 
  } => {
    let result = {
      colliding: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      objectName: undefined as string | undefined
    }

    // Créer une boîte englobante pour le joueur
    const playerBox = new THREE.Box3(
      new THREE.Vector3(
        point.x - playerRadius,
        point.y,
        point.z - playerRadius
      ),
      new THREE.Vector3(
        point.x + playerRadius,
        point.y + playerHeight,
        point.z + playerRadius
      )
    )

    for (const obj of collisionObjects.current) {
      if (playerBox.intersectsBox(obj.boundingBox)) {
        result.colliding = true
        result.objectName = obj.name

        // Calculer la normale et la pénétration
        const objCenter = obj.boundingBox.getCenter(new THREE.Vector3())
        const playerCenter = playerBox.getCenter(new THREE.Vector3())
        const direction = playerCenter.clone().sub(objCenter)

        // Calculer la pénétration sur chaque axe
        const objSize = obj.boundingBox.getSize(new THREE.Vector3())
        const playerSize = playerBox.getSize(new THREE.Vector3())

        const penetrationX = (objSize.x + playerSize.x) / 2 - Math.abs(direction.x)
        const penetrationY = (objSize.y + playerSize.y) / 2 - Math.abs(direction.y)
        const penetrationZ = (objSize.z + playerSize.z) / 2 - Math.abs(direction.z)

        // Choisir l'axe avec la plus petite pénétration
        if (penetrationX <= penetrationY && penetrationX <= penetrationZ) {
          result.normal.set(Math.sign(direction.x), 0, 0)
          result.penetration = penetrationX
        } else if (penetrationY <= penetrationZ) {
          result.normal.set(0, Math.sign(direction.y), 0)
          result.penetration = penetrationY
        } else {
          result.normal.set(0, 0, Math.sign(direction.z))
          result.penetration = penetrationZ
        }

        // Prendre la première collision trouvée
        break
      }
    }

    return result
  }

  // Fonction pour vérifier si un point est sur le sol (île GLTF)
  const checkGroundCollision = (point: THREE.Vector3): { onGround: boolean; groundY: number } => {
    let onGround = false
    let groundY = 0

    // Chercher l'île dans les collisions
    const islandCollision = collisionObjects.current.find(obj => 
      obj.name?.toLowerCase().includes('island')
    )
    
    if (islandCollision) {
      const box = islandCollision.boundingBox
      // Vérifier si le point est dans la zone XZ de l'île
      if (point.x >= box.min.x && point.x <= box.max.x &&
          point.z >= box.min.z && point.z <= box.max.z) {
        groundY = box.max.y // Le dessus de l'île
        onGround = point.y <= groundY + 0.2
      }
    }

    return { onGround, groundY }
  }

  // Fonction pour nettoyer les collisions
  const clearCollisions = () => {
    collisionObjects.current = []
  }

  return {
    addGLTFCollision,
    checkCollisionWithPoint,
    checkGroundCollision,
    clearCollisions,
    collisionObjects: collisionObjects.current
  }
}
