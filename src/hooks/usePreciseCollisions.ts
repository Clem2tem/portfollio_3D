import { useCallback, useRef } from 'react'
import * as THREE from 'three'

interface PreciseCollisionObject {
  name: string
  meshes: THREE.Mesh[]
  boundingBox: THREE.Box3 // Pour optimisation
}

export const usePreciseCollisions = () => {
  const collisionObjects = useRef<PreciseCollisionObject[]>([])

  const addPreciseCollisionObject = useCallback((name: string, object3D: THREE.Object3D) => {
    // Éviter les doublons
    const existingIndex = collisionObjects.current.findIndex(obj => obj.name === name)
    if (existingIndex !== -1) {
      collisionObjects.current.splice(existingIndex, 1)
    }

    const meshes: THREE.Mesh[] = []
    const boundingBox = new THREE.Box3()

    // Collecter tous les meshes de l'objet
    object3D.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        meshes.push(child)
        
        // Calculer la bounding box du mesh en coordonnées mondiales
        const meshBox = new THREE.Box3().setFromObject(child)
        boundingBox.union(meshBox)
      }
    })

    if (meshes.length > 0) {
      collisionObjects.current.push({
        name,
        meshes,
        boundingBox
      })

      console.log(`Collision précise ajoutée pour ${name}: ${meshes.length} meshes`)
    }
  }, [])

  // Vérification rapide avec bounding box puis précise avec géométrie
  const checkPreciseCollision = useCallback((position: THREE.Vector3, radius: number = 0.5): {
    colliding: boolean
    normal: THREE.Vector3
    penetration: number
    objectName?: string
    point?: THREE.Vector3
  } => {
    const result = {
      colliding: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      objectName: undefined as string | undefined,
      point: undefined as THREE.Vector3 | undefined
    }

    // Créer une sphère pour le joueur
    const playerSphere = new THREE.Sphere(position, radius)

    for (const obj of collisionObjects.current) {
      // Test rapide avec bounding box
      if (!obj.boundingBox.intersectsSphere(playerSphere)) {
        continue
      }

      // Test précis avec géométrie
      for (const mesh of obj.meshes) {
        const meshCollision = checkSphereToMeshCollision(playerSphere, mesh)
        
        if (meshCollision.colliding) {
          // Vérifier si on est au-dessus de l'objet (permettre le mouvement)
          const playerBottom = position.y - radius
          const contactTop = meshCollision.contactPoint.y
          
          // Si le joueur est clairement au-dessus, ne pas bloquer le mouvement horizontal
          if (playerBottom > contactTop + 0.1) {
            continue
          }
          
          // Vérifier si c'est une collision latérale ou frontale (bloquer)
          const normalY = Math.abs(meshCollision.normal.y)
          if (normalY < 0.7) { // Collision latérale/frontale
            result.colliding = true
            result.objectName = obj.name
            result.normal = meshCollision.normal
            result.penetration = meshCollision.penetration
            result.point = meshCollision.contactPoint
            return result
          }
        }
      }
    }

    return result
  }, [])

  // Fonction pour détecter collision entre sphère et mesh avec rotations
  const checkSphereToMeshCollision = (sphere: THREE.Sphere, mesh: THREE.Mesh): {
    colliding: boolean
    normal: THREE.Vector3
    penetration: number
    contactPoint: THREE.Vector3
  } => {
    const result = {
      colliding: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      contactPoint: new THREE.Vector3()
    }

    if (!mesh.geometry) return result

    // Obtenir la matrice de transformation du mesh (avec rotations)
    mesh.updateMatrixWorld()
    const inverseMatrix = mesh.matrixWorld.clone().invert()
    
    // Transformer la sphère dans l'espace local du mesh
    const localCenter = sphere.center.clone().applyMatrix4(inverseMatrix)
    
    // Calculer le rayon dans l'espace local (tenir compte de l'échelle)
    const scale = new THREE.Vector3()
    mesh.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale)
    const avgScale = (scale.x + scale.y + scale.z) / 3
    const localRadius = sphere.radius / avgScale

    const localSphere = new THREE.Sphere(localCenter, localRadius)

    // Vérifier l'intersection avec la géométrie
    const intersection = checkSphereGeometryIntersection(localSphere, mesh.geometry)
    
    if (intersection.colliding) {
      result.colliding = true
      
      // Transformer le point de contact et la normale vers l'espace monde
      result.contactPoint = intersection.contactPoint.clone().applyMatrix4(mesh.matrixWorld)
      result.normal = intersection.normal.clone()
        .transformDirection(mesh.matrixWorld)
        .normalize()
      
      result.penetration = intersection.penetration * avgScale
    }

    return result
  }

  // Vérification d'intersection sphère-géométrie améliorée
  const checkSphereGeometryIntersection = (sphere: THREE.Sphere, geometry: THREE.BufferGeometry): {
    colliding: boolean
    contactPoint: THREE.Vector3
    normal: THREE.Vector3
    penetration: number
  } => {
    const result = {
      colliding: false,
      contactPoint: new THREE.Vector3(),
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0
    }

    const position = geometry.attributes.position
    if (!position) return result

    let closestDistance = Infinity
    let closestPoint = new THREE.Vector3()
    let closestNormal = new THREE.Vector3(0, 1, 0)

    // Vérifier les triangles pour une détection précise
    if (geometry.index) {
      const index = geometry.index
      for (let i = 0; i < index.count; i += 3) {
        const a = new THREE.Vector3(
          position.getX(index.getX(i)),
          position.getY(index.getX(i)),
          position.getZ(index.getX(i))
        )
        const b = new THREE.Vector3(
          position.getX(index.getX(i + 1)),
          position.getY(index.getX(i + 1)),
          position.getZ(index.getX(i + 1))
        )
        const c = new THREE.Vector3(
          position.getX(index.getX(i + 2)),
          position.getY(index.getX(i + 2)),
          position.getZ(index.getX(i + 2))
        )

        const triangle = new THREE.Triangle(a, b, c)
        const closestPointOnTriangle = new THREE.Vector3()
        triangle.closestPointToPoint(sphere.center, closestPointOnTriangle)
        
        const distance = sphere.center.distanceTo(closestPointOnTriangle)
        
        if (distance <= sphere.radius && distance < closestDistance) {
          result.colliding = true
          closestDistance = distance
          closestPoint = closestPointOnTriangle.clone()
          
          // Calculer la normale du triangle
          const normal = new THREE.Vector3()
          triangle.getNormal(normal)
          closestNormal = normal
        }
      }
    } else {
      // Fallback pour géométries sans index
      for (let i = 0; i < position.count; i += 3) {
        const a = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i))
        const b = new THREE.Vector3(position.getX(i + 1), position.getY(i + 1), position.getZ(i + 1))
        const c = new THREE.Vector3(position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2))

        const triangle = new THREE.Triangle(a, b, c)
        const closestPointOnTriangle = new THREE.Vector3()
        triangle.closestPointToPoint(sphere.center, closestPointOnTriangle)
        
        const distance = sphere.center.distanceTo(closestPointOnTriangle)
        
        if (distance <= sphere.radius && distance < closestDistance) {
          result.colliding = true
          closestDistance = distance
          closestPoint = closestPointOnTriangle.clone()
          
          const normal = new THREE.Vector3()
          triangle.getNormal(normal)
          closestNormal = normal
        }
      }
    }

    if (result.colliding) {
      result.contactPoint = closestPoint
      result.normal = closestNormal
      result.penetration = sphere.radius - closestDistance
    }

    return result
  }

  // Obtenir la hauteur du sol pour la gravité
  const getGroundHeight = useCallback((position: THREE.Vector3): number => {
    // Chercher l'île dans les objets de collision
    const islandObj = collisionObjects.current.find(obj => 
      obj.name?.toLowerCase().includes('island')
    )
    
    if (!islandObj) return 0

    // Lancer un rayon vers le bas pour trouver le sol
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(position.x, position.y + 10, position.z),
      new THREE.Vector3(0, -1, 0)
    )

    let maxY = 0
    for (const mesh of islandObj.meshes) {
      const intersections = raycaster.intersectObject(mesh)
      if (intersections.length > 0) {
        maxY = Math.max(maxY, intersections[0].point.y)
      }
    }

    return maxY
  }, [])

  const clearCollisions = useCallback(() => {
    collisionObjects.current = []
  }, [])

  return {
    addPreciseCollisionObject,
    checkPreciseCollision,
    getGroundHeight,
    clearCollisions,
    collisionObjects: collisionObjects.current
  }
}
