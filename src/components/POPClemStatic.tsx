import React from 'react'
import {useGLTF } from '@react-three/drei'

const POPClemStatic: React.FC = () => {

    const gltf = useGLTF('models/POP/POPClem2.glb')

                        return (
                            <primitive
                                object={gltf.scene}
                                scale={0.05}
                                position={[-1, 0, 1]}
                                rotation={[0, Math.PI / 3, 0]}
                            />
                        )

}

export default POPClemStatic
