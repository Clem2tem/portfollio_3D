import React, { forwardRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

type Vec3 = [number, number, number]

interface HouseProps {
    position?: Vec3
    rotation?: Vec3
    scale?: number | Vec3
}

const House = forwardRef<THREE.Group, HouseProps>(
    (
        {
            position = [0.4, 0.05, -0.2],
            rotation = [0, (-4.2 * Math.PI) / 12, 0],
            scale = 1
        },
        ref
    ) => {
        const gltf = useGLTF('models/House/House.glb')

        React.useEffect(() => {
            if (!gltf) return
            try {
                if (gltf.scene) {
                    if (!gltf.scene.name) gltf.scene.name = 'house'
                    gltf.scene.userData = {
                        ...(gltf.scene.userData || {}),
                        collisionName: 'house',
                        animated: false
                    }
                }
            } catch (e) {
                // ignore tagging errors
            }
        }, [gltf])

        if (!gltf) return null

        return (
            <primitive
                ref={ref}
                object={gltf.scene}
                scale={scale}
                position={position}
                rotation={rotation}
            />
        )
    }
)

export default House
