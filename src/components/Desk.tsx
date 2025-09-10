import React from 'react'
import { useGLTF } from '@react-three/drei'

const Desk: React.FC = () => {
    const gltf = useGLTF('models/Desk/Desk.glb')

        React.useEffect(() => {
            if (!gltf) return;
            // mark the root scene so collision discovery can find this object regardless of its world position
            try {
                if (gltf.scene) {
                    if (!gltf.scene.name) gltf.scene.name = 'desk'
                    gltf.scene.userData = { ...(gltf.scene.userData || {}), collisionName: 'desk', animated: false }
                }
            } catch (e) {}
        }, [gltf]);
    


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
