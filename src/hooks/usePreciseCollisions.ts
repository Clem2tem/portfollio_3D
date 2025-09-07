// usePreciseCollisions.ts — BVH version (TypeScript safe)
import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Accélération raycast
;(THREE.Mesh.prototype as any).raycast = acceleratedRaycast

export type Collider = {
  name: string
  mesh: THREE.Mesh
  boundingBox: THREE.Box3
  isStatic: boolean
  // optional: original object used to build this collider (kept for visualization or animated items)
  sourceObject?: THREE.Object3D
  // if true, this collider was registered as animated — visualization should follow the source object
  animated?: boolean
  // matrixWorld of the source at bake time (used to rebase baked world-space geometry to local for animated visuals)
  bakeMatrix?: THREE.Matrix4
}

export interface CollisionResult {
  colliding: boolean
  normal: THREE.Vector3
  penetration: number
  objectName?: string
}

// Global pointer to the current colliders array so any component can read it
let GLOBAL_COLLIDERS_REF: { current: Collider[] } | null = null
export const getCollisionObjectsGlobal = (): Collider[] => GLOBAL_COLLIDERS_REF?.current ?? []

export const usePreciseCollisions = () => {
  const collidersRef = useRef<Collider[]>([])
  const raycasterRef = useRef(new THREE.Raycaster())
  // expose this ref globally for read-only visualization
  GLOBAL_COLLIDERS_REF = collidersRef

  const buildMergedCollisionGeometry = useCallback((root: THREE.Object3D): THREE.BufferGeometry | null => {
    const geoms: THREE.BufferGeometry[] = []
    const pushGeom = (g: THREE.BufferGeometry) => geoms.push(mergeVertices(g, 1e-4))

    const shouldIncludeMesh = (mesh: THREE.Mesh) => {
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      if (mat && (mat as any).transparent && (mat as any).opacity < 0.1) return false
      const n = mesh.name.toLowerCase()
      if (n.includes('billboard') || n.includes('leaf') || n.includes('foliage')) return false
      return true
    }

    root.updateMatrixWorld(true)
    root.traverse((child) => {
      if ((child as any).isSkinnedMesh) return

      if ((child as any).isInstancedMesh) {
        const inst = child as THREE.InstancedMesh
        if (!inst.geometry) return
        if (!shouldIncludeMesh(inst as unknown as THREE.Mesh)) return
        const base = inst.geometry
        const m = new THREE.Matrix4()
        const world = new THREE.Matrix4().copy(inst.matrixWorld)
        for (let i = 0; i < inst.count; i++) {
          inst.getMatrixAt(i, m)
          const g = base.clone()
          g.applyMatrix4(m).applyMatrix4(world)
          pushGeom(g)
        }
        return
      }

      if (child instanceof THREE.Mesh && child.geometry) {
        if (!shouldIncludeMesh(child)) return
        const g = child.geometry.clone()
        g.applyMatrix4(child.matrixWorld)
        pushGeom(g)
      }
    })

    if (geoms.length === 0) return null
    const merged = mergeGeometries(geoms, true)
    merged.computeBoundingBox()
    return merged
  }, [])

  const addPreciseCollisionObject = useCallback((name: string, object3D: THREE.Object3D, options?: { animated?: boolean }) => {
    if (collidersRef.current.find((c) => c.name === name)) return
    const merged = buildMergedCollisionGeometry(object3D)
    if (!merged) {
      console.warn(`[Collisions] Aucun mesh statique détecté pour "${name}"`)
      return
    }
    const bvh = new MeshBVH(merged)
    ;(merged as any).boundsTree = bvh

    const colliderMesh = new THREE.Mesh(merged)
    colliderMesh.matrixAutoUpdate = false
    colliderMesh.visible = false

    const box = new THREE.Box3().copy(merged.boundingBox!)
    // ensure source object's world matrix is up-to-date and capture it as the bake matrix
    object3D.updateMatrixWorld(true)
    const bakeMatrix = object3D.matrixWorld.clone()
    collidersRef.current.push({
      name,
      mesh: colliderMesh,
      boundingBox: box,
      isStatic: true,
      sourceObject: object3D,
      animated: !!options?.animated,
      bakeMatrix,
    })
  }, [buildMergedCollisionGeometry])

  // Broadphase rapide
  const aabbIntersectsSphere = (box: THREE.Box3, center: THREE.Vector3, radius: number) => {
    const p = new THREE.Vector3(
      Math.max(box.min.x, Math.min(center.x, box.max.x)),
      Math.max(box.min.y, Math.min(center.y, box.max.y)),
      Math.max(box.min.z, Math.min(center.z, box.max.z)),
    )
    return p.distanceToSquared(center) <= radius * radius
  }

  // Collision sphère ↔ mesh triangles (normal = "éloignement" pour robustesse)
  const checkPreciseCollision = useCallback((position: THREE.Vector3, radius: number = 0.5): CollisionResult => {
    const result: CollisionResult = { colliding: false, normal: new THREE.Vector3(0,1,0), penetration: 0, objectName: undefined }
    if (collidersRef.current.length === 0) return result

    const sphereAABB = new THREE.Box3().setFromCenterAndSize(position, new THREE.Vector3(2*radius, 2*radius, 2*radius))
    const tri = new THREE.Triangle()
    const closest = new THREE.Vector3()

    let bestPen = 0
    const bestN = new THREE.Vector3()
    let bestName: string | undefined

    for (const col of collidersRef.current) {
      if (!col.boundingBox.intersectsBox(sphereAABB)) continue
      if (!aabbIntersectsSphere(col.boundingBox, position, radius)) continue

      const bvh: MeshBVH | undefined = (col.mesh.geometry as any).boundsTree
      if (!bvh) continue

      bvh.shapecast({
        intersectsBounds: (b: THREE.Box3) => b.intersectsBox(sphereAABB),
        intersectsTriangle: (t: THREE.Triangle) => {
          tri.a.copy(t.a); tri.b.copy(t.b); tri.c.copy(t.c)
          tri.closestPointToPoint(position, closest)
          const dist = closest.distanceTo(position)
          if (dist < radius) {
            const away = position.clone().sub(closest)
            if (away.lengthSq() < 1e-10) return false
            away.normalize()
            const pen = (radius - dist)
            if (pen > bestPen) {
              bestPen = pen
              bestN.copy(away)
              bestName = col.name
            }
          }
          return false
        },
      })
    }

    if (bestPen > 0) {
      result.colliding = true
      result.penetration = bestPen
      result.normal.copy(bestN)
      result.objectName = bestName
    }
    return result
  }, [])

  // GroundHeight = uniquement l’ÎLE (nom contient “island”)
  const getGroundHeight = useCallback((position: THREE.Vector3, yMax: number = 1000): number => {
    const raycaster = raycasterRef.current as THREE.Raycaster & { firstHitOnly?: boolean }
    const prev = (raycaster as any).firstHitOnly
    ;(raycaster as any).firstHitOnly = false // on veut le plus haut hit

    const island = collidersRef.current.find(c => c.name?.toLowerCase().includes('island'))
    if (!island) { (raycaster as any).firstHitOnly = prev; return 0 }

    // hors AABB île → 0
    if (position.x < island.boundingBox.min.x || position.x > island.boundingBox.max.x ||
        position.z < island.boundingBox.min.z || position.z > island.boundingBox.max.z) {
      (raycaster as any).firstHitOnly = prev
      return 0
    }

    raycaster.ray.origin.set(position.x, yMax, position.z)
    raycaster.ray.direction.set(0, -1, 0)
    const hits = raycaster.intersectObject(island.mesh, false)

    let bestY = -Infinity
    for (const h of hits) if (h?.point) bestY = Math.max(bestY, h.point.y)

    ;(raycaster as any).firstHitOnly = prev
    return Number.isFinite(bestY) ? bestY : 0
  }, [])

  // Support raycast: find the highest walkable surface below the given x/z within step limits, excluding Island by default.
  // Returns the y (height), the surface normal and collider name if found; otherwise y = -Infinity.
  const getSupportBelow = useCallback((
    position: THREE.Vector3,
    options?: {
      maxStepUp?: number
      maxStepDown?: number
      maxSlopeDeg?: number
      includeIsland?: boolean // if true include Island meshes in support search; default false
    }
  ): { y: number; normal: THREE.Vector3 | null; name?: string } => {
    const { maxStepUp = 0.3, maxStepDown = 0.6, maxSlopeDeg = 45, includeIsland = false } = options || {}
    const raycaster = raycasterRef.current as THREE.Raycaster & { firstHitOnly?: boolean }
    const prevFirst = (raycaster as any).firstHitOnly
    ;(raycaster as any).firstHitOnly = false

    const cosMax = Math.cos(THREE.MathUtils.degToRad(maxSlopeDeg))
    const x = position.x
    const z = position.z
    const yStart = position.y + maxStepUp
    const yMin = position.y - maxStepDown

    let bestY = -Infinity
    let bestNormal: THREE.Vector3 | null = null
    let bestName: string | undefined

    for (const col of collidersRef.current) {
      const isIsland = col.name?.toLowerCase().includes('island')
      if (!includeIsland && isIsland) continue
      if (x < col.boundingBox.min.x || x > col.boundingBox.max.x || z < col.boundingBox.min.z || z > col.boundingBox.max.z) continue

      raycaster.ray.origin.set(x, yStart, z)
      raycaster.ray.direction.set(0, -1, 0)
      const hits = raycaster.intersectObject(col.mesh, false)
      if (!hits || hits.length === 0) continue

      for (const h of hits) {
        if (!h.point) continue
        const y = h.point.y
        if (y > yStart + 1e-4 || y < yMin) continue
        const faceNormal = (h as any).face?.normal as THREE.Vector3 | undefined
        const n = faceNormal ? faceNormal.clone().normalize() : (h.normal ? h.normal.clone().normalize() : new THREE.Vector3(0,1,0))
        const isOkSlope = isIsland || n.y >= cosMax
        if (!isOkSlope) continue
        if (y > bestY) {
          bestY = y
          bestNormal = n
          bestName = col.name
        }
      }
    }

    ;(raycaster as any).firstHitOnly = prevFirst
    return { y: bestY, normal: bestNormal, name: bestName }
  }, [])

  const clearCollisions = useCallback(() => { collidersRef.current = [] }, [])

  return {
    addPreciseCollisionObject,
    checkPreciseCollision,
    getGroundHeight,         // ← ne considère que “Island”
    getSupportBelow,         // walkable support (excl. Island by default)
    clearCollisions,
    collisionObjects: collidersRef.current,
  }
}
