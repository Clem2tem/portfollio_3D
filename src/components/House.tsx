import React, { forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
const House = forwardRef<THREE.Group, { position: [number, number, number] }>(({ position }) => {

    const gltf = useGLTF('models/House/House.glb')
    
            React.useEffect(() => {
                    if (!gltf) return;
                    // mark the root scene so collision discovery can find this object regardless of its world position
                    try {
                        if (gltf.scene) {
                            if (!gltf.scene.name) gltf.scene.name = 'house'
                            gltf.scene.userData = { ...(gltf.scene.userData || {}), collisionName: 'house', animated: false }
                        }
                    } catch (e) {}
                }, [gltf]);

                        return (
                                <primitive
                                    object={gltf.scene}
                                    scale={0.3}
                                    position= {[position[0]-3, position[1], position[2]+5]}
                                    rotation={[0, -3.65 * Math.PI/4, 0]}
                                />
                        )

});

export default House
