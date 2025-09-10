import React, { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const Desk: React.FC = () => {
    const gltf = useGLTF('models/Desk/Desk.glb')

    useEffect(() => {
        gltf.scene.traverse((child: any) => {
            if (child.isMesh && child.name.includes('KLight')) {
                // Création d'une vraie lumière sous chaque touche
                const light = new THREE.PointLight(0x00ffcc, 3, 0.7) // couleur, intensité, distance
                // Positionner la lumière légèrement en dessous de la touche
                const bbox = new THREE.Box3().setFromObject(child)
                const center = bbox.getCenter(new THREE.Vector3())
                const max = bbox.max
                light.position.set(center.x, max.y, center.z)
                

                child.parent.add(light) // ajouter la lumière dans la même hiérarchie
            }
        })
    }, [gltf])


    return (
        <primitive
            object={gltf.scene}
            scale={[50, 50, 50]}
            position={[13, -43, 5]}
            rotation={[0, -Math.PI / 3, 0]}
        />
    )
}

export default Desk
