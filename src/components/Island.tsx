import React from 'react'
import {useGLTF } from '@react-three/drei'

const Island: React.FC = () => {

    const gltf = useGLTF('models/Island/Island.glb')

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
