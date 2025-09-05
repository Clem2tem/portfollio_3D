// usePreciseCollisions.ts — BVH version (TypeScript safe)
import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

    // Activer le raycast accéléré pour toutes les Mesh
    ; (THREE.Mesh.prototype as any).raycast = acceleratedRaycast

type Collider = {
    name: string
    mesh: THREE.Mesh               // Mesh fusionné (statique) servant à la collision
    boundingBox: THREE.Box3        // Broadphase AABB
    isStatic: boolean              // Toujours true ici (colliders statiques)
}

interface CollisionResult {
    colliding: boolean
    normal: THREE.Vector3
    penetration: number
    objectName?: string
}

export const usePreciseCollisions = () => {
    const collidersRef = useRef<Collider[]>([])
    const raycasterRef = useRef(new THREE.Raycaster())

    // ---------- Construit une géométrie de collision fusionnée depuis un Object3D ----------
    const buildMergedCollisionGeometry = useCallback((root: THREE.Object3D): THREE.BufferGeometry | null => {
        const geoms: THREE.BufferGeometry[] = []

        // petits helpers
        const pushGeom = (g: THREE.BufferGeometry) => {
            // indexer + dédoublonner pour un BVH plus propre
            const indexed = mergeVertices(g, 1e-4)
            geoms.push(indexed)
        }

        // optionnel : ignorer certains meshes "visuels" (billboards, feuilles, décors plats)
        const shouldIncludeMesh = (mesh: THREE.Mesh) => {
            const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
            // ⚠️ les alpha-cutouts restent des grands quads : souvent mieux de les ignorer côté collision
            if (mat && (mat as any).transparent && (mat as any).opacity < 0.99) return false
            if (mesh.name.toLowerCase().includes('billboard')) return false
            if (mesh.name.toLowerCase().includes('leaf')) return false
            if (mesh.name.toLowerCase().includes('foliage')) return false
            return true
        }

        root.updateMatrixWorld(true)

        root.traverse((child) => {
            // skip skinned / lines / points
            if ((child as any).isSkinnedMesh) return

            // --- InstancedMesh : dupliquer chaque instance ---
            if ((child as any).isInstancedMesh) {
                const inst = child as THREE.InstancedMesh
                if (!inst.geometry) return
                if (!shouldIncludeMesh(inst as unknown as THREE.Mesh)) return

                const base = inst.geometry
                const m = new THREE.Matrix4()
                const world = new THREE.Matrix4().copy(inst.matrixWorld)

                // on fusionne base dans le monde de chaque instance
                const count = inst.count
                for (let i = 0; i < count; i++) {
                    inst.getMatrixAt(i, m)
                    const g = base.clone()
                    g.applyMatrix4(m)
                    g.applyMatrix4(world)
                    pushGeom(g)
                }
                return
            }

            // --- Mesh normal ---
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

    // ---------- Ajout d’un collider à partir d’un Object3D ----------
    const addPreciseCollisionObject = useCallback((name: string, object3D: THREE.Object3D) => {
        // éviter les doublons par nom
        if (collidersRef.current.find((c) => c.name === name)) return

        const merged = buildMergedCollisionGeometry(object3D)
        if (!merged) {
            console.warn(`[Collisions] Aucun mesh statique détecté pour "${name}"`)
            return
        }

        // Construire le BVH (options par défaut OK ; supprimer lazyGeneration)
        const bvh = new MeshBVH(merged /*, { strategy: MeshBVH.SAH } */)
            ; (merged as any).boundsTree = bvh

        // Créer le mesh collider (invisible)
        const colliderMesh = new THREE.Mesh(merged)
        colliderMesh.matrixAutoUpdate = false
        colliderMesh.visible = false

        // boundingBox est non-null car computeBoundingBox() a été appelé
        const box = new THREE.Box3().copy(merged.boundingBox!)

        collidersRef.current.push({
            name,
            mesh: colliderMesh,
            boundingBox: box,
            isStatic: true,
        })

        console.log(`[Collisions] BVH construit pour "${name}"`)
    }, [buildMergedCollisionGeometry])

    // ---------- Broadphase: test AABB d’une sphère ----------
    const aabbIntersectsSphere = (box: THREE.Box3, center: THREE.Vector3, radius: number) => {
        const closestPoint = new THREE.Vector3(
            Math.max(box.min.x, Math.min(center.x, box.max.x)),
            Math.max(box.min.y, Math.min(center.y, box.max.y)),
            Math.max(box.min.z, Math.min(center.z, box.max.z)),
        )
        return closestPoint.distanceToSquared(center) <= radius * radius
    }

    // ---------- Narrowphase: sphere vs triangle mesh via BVH.shapecast ----------
    const checkPreciseCollision = useCallback((position: THREE.Vector3, radius: number = 0.5): CollisionResult => {
        const result: CollisionResult = {
            colliding: false,
            normal: new THREE.Vector3(0, 1, 0),
            penetration: 0,
            objectName: undefined,
        }

        if (collidersRef.current.length === 0) return result

        // AABB de la sphère pour filtrer rapidement
        const sphereAABB = new THREE.Box3().setFromCenterAndSize(
            position,
            new THREE.Vector3(2 * radius, 2 * radius, 2 * radius),
        )

        const tri = new THREE.Triangle()
        const closest = new THREE.Vector3()
        const nrm = new THREE.Vector3()

        let bestPenetration = 0
        const bestNormal = new THREE.Vector3()
        let bestName: string | undefined

        for (const col of collidersRef.current) {
            // Broadphase: AABB collider vs AABB sphère
            if (!col.boundingBox.intersectsBox(sphereAABB)) continue
            // Test rapide sphere vs AABB
            if (!aabbIntersectsSphere(col.boundingBox, position, radius)) continue

            const geom = col.mesh.geometry as any
            const bvh: MeshBVH | undefined = geom.boundsTree
            if (!bvh) continue

            bvh.shapecast({
                intersectsBounds: (bounds: THREE.Box3) => bounds.intersectsBox(sphereAABB),
                intersectsTriangle: (triangle: THREE.Triangle) => {
                    tri.a.copy(triangle.a)
                    tri.b.copy(triangle.b)
                    tri.c.copy(triangle.c)

                    // Point le plus proche du centre de la sphère sur le triangle
                    tri.closestPointToPoint(position, closest)
                    const dist = closest.distanceTo(position)

                    if (dist < radius) {
                        tri.getNormal(nrm)
                        if (nrm.lengthSq() < 1e-10) return false
                        nrm.normalize()

                        const penetration = radius - dist
                        if (penetration > bestPenetration) {
                            bestPenetration = penetration
                            bestNormal.copy(nrm)
                            bestName = col.name
                        }
                    }
                    return false // continuer à tester
                },
            })
        }

        if (bestPenetration > 0) {
            result.colliding = true
            result.penetration = bestPenetration
            result.normal.copy(bestNormal)
            result.objectName = bestName
        }

        return result
    }, [])

    // ---------- Hauteur du sol par raycast vertical (accéléré BVH) ----------
    const getGroundHeight = useCallback((position: THREE.Vector3, yMax: number = 1000): number => {
        const raycaster = raycasterRef.current as THREE.Raycaster & { firstHitOnly?: boolean }
        // pour ce calcul on veut récupérer le (ou les) intersection(s) les plus hautes,
        // donc on désactive temporairement firstHitOnly pour être sûr d'avoir toutes les intersections
        const prevFirstHit = (raycaster as any).firstHitOnly
        ; (raycaster as any).firstHitOnly = false

        raycaster.ray.origin.set(position.x, yMax, position.z)
        raycaster.ray.direction.set(0, -1, 0)

        // ne prendre en compte que l'île pour le groundHeight
        const islandCollider = collidersRef.current.find(c => c.name && c.name.toLowerCase().includes('island'))
        if (!islandCollider) {
            ; (raycaster as any).firstHitOnly = prevFirstHit
            return 0
        }

        // filtre AABB planimétrique rapide : si on est hors de l'étendue de l'île, rien
        if (position.x < islandCollider.boundingBox.min.x || position.x > islandCollider.boundingBox.max.x) {
            ; (raycaster as any).firstHitOnly = prevFirstHit
            return 0
        }
        if (position.z < islandCollider.boundingBox.min.z || position.z > islandCollider.boundingBox.max.z) {
            ; (raycaster as any).firstHitOnly = prevFirstHit
            return 0
        }

        const hits = raycaster.intersectObject(islandCollider.mesh, false)
        let bestY = -Infinity
        for (const h of hits) {
            if (h && h.point && h.point.y > bestY) bestY = h.point.y
        }

        ; (raycaster as any).firstHitOnly = prevFirstHit
        return Number.isFinite(bestY) ? bestY : 0
    }, [])

    // ---------- Reset ----------
    const clearCollisions = useCallback(() => {
        collidersRef.current = []
    }, [])

    return {
        addPreciseCollisionObject, // (name, object3D)
        checkPreciseCollision,     // (position, radius)
        getGroundHeight,           // (position)
        clearCollisions,
        collisionObjects: collidersRef.current,
    }
}
