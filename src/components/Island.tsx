import React from 'react'
import {useGLTF } from '@react-three/drei'

const Island: React.FC = () => {

    const gltf = useGLTF('models/Island/Island.glb')

    React.useEffect(() => {
                        if (!gltf) return;
                        // mark the root scene so collision discovery can find this object regardless of its world position
                        try {
                            if (gltf.scene) {
                                if (!gltf.scene.name) gltf.scene.name = 'island'
                                gltf.scene.userData = { ...(gltf.scene.userData || {}), collisionName: 'island', animated: false }
                            }
                        } catch (e) {}
                    }, [gltf]);

                        return (
                            <primitive
                                object={gltf.scene}
                                scale={[1.5, 1.5, 1.5]}
                                position={[0, -3.04, 0]}
                                rotation={[0, -Math.PI / 3, 0]}
                            />
                        )

}

export default Island
