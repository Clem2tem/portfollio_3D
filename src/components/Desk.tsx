import React from 'react'
import {useGLTF } from '@react-three/drei'

const Desk: React.FC = () => {

    const gltf = useGLTF('models/Desk/Desk.glb')

                        return (
                            <primitive
                                object={gltf.scene}
                                scale={[50, 50, 50]}
                                position={[13, -43, 5]}
                                rotation={[0,-Math.PI / 3, 0]}
                            />
                        )

}

export default Desk
