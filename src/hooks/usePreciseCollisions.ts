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

    // Créer une sphère pour le joueur (plus réaliste qu'une boîte)
    const playerSphere = new THREE.Sphere(position, radius)

    for (const obj of collisionObjects.current) {
      // Test rapide avec bounding box
      if (!obj.boundingBox.intersectsSphere(playerSphere)) {
        continue
      }

      // Test précis avec géométrie
      for (const mesh of obj.meshes) {
        if (checkSphereToMeshCollision(playerSphere, mesh)) {
          result.colliding = true
          result.objectName = obj.name

          // Calculer la normale de collision approximative
          const meshCenter = new THREE.Vector3()
          obj.boundingBox.getCenter(meshCenter)
          result.normal = position.clone().sub(meshCenter).normalize()
          
          // Calculer la pénétration approximative
          const distance = position.distanceTo(meshCenter)
          const meshRadius = obj.boundingBox.getSize(new THREE.Vector3()).length() / 2
          result.penetration = Math.max(0, radius + meshRadius - distance)

          return result
        }
      }
    }

    return result
  }, [])

  // Fonction pour détecter collision entre sphère et mesh
  const checkSphereToMeshCollision = (sphere: THREE.Sphere, mesh: THREE.Mesh): boolean => {
    if (!mesh.geometry) return false

    // Obtenir la matrice de transformation du mesh
    mesh.updateMatrixWorld()
    const inverseMatrix = mesh.matrixWorld.clone().invert()
    
    // Transformer la sphère dans l'espace local du mesh
    const localCenter = sphere.center.clone().applyMatrix4(inverseMatrix)
    const localSphere = new THREE.Sphere(localCenter, sphere.radius)

    // Vérifier si la sphère intersecte avec la géométrie
    return checkSphereGeometryIntersection(localSphere, mesh.geometry)
  }

  // Vérification d'intersection sphère-géométrie
  const checkSphereGeometryIntersection = (sphere: THREE.Sphere, geometry: THREE.BufferGeometry): boolean => {
    const position = geometry.attributes.position
    if (!position) return false

    // Vérifier si des vertices sont dans la sphère
    for (let i = 0; i < position.count; i++) {
      const vertex = new THREE.Vector3(
        position.getX(i),
        position.getY(i),
        position.getZ(i)
      )
      
      if (sphere.containsPoint(vertex)) {
        return true
      }
    }

    // Vérifier les triangles pour une détection plus précise
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
        const closestPoint = new THREE.Vector3()
        triangle.closestPointToPoint(sphere.center, closestPoint)
        
        if (sphere.center.distanceTo(closestPoint) <= sphere.radius) {
          return true
        }
      }
    }

    return false
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
