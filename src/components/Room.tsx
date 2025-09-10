import React from 'react'
import { useGLTF } from '@react-three/drei'

const Room: React.FC = () => {
    const gltf = useGLTF('models/Room/Room.glb')


    return (
        <primitive
            object={gltf.scene}
            scale={0.8}
            position={[110, -42, 110]}
            rotation={[0, Math.PI - Math.PI / 3, 0]}
        />
    )
}

export default Room
