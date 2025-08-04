import React, { useState } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

const HospitalGLTF: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const gltf = useGLTF('models/CHU/CHU.gltf');
    const [hovered, setHovered] = useState(false);

    React.useEffect(() => {
        if (!gltf) return;
        gltf.scene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Optionnel : patch matériau pour cohérence visuelle
                if (child.material) {
                    child.material.roughness = 0.7;
                    child.material.metalness = 0.1;
                }
            }
        });
    }, [gltf]);




    if (!gltf) return null;
    // Charge la texture du logo une seule fois
    const logoTexture = useLoader(TextureLoader, '/logos/medchem.png');
    logoTexture.anisotropy = 8;
    // Ref pour le logo
    const logoRef = React.useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (logoRef.current) {
            // Flottement vertical
            const t = state.clock.getElapsedTime();
            logoRef.current.position.y = 0.7 + Math.sin(t * 2) * 0.05;
            // Rotation
            logoRef.current.rotation.y = t * 0.8;
        }
    });
    return (
        <group>
            <primitive
                object={gltf.scene}
                scale={[0.2, 0.2, 0.2]}
                position={position}
                rotation={[0, -Math.PI / 3, 0]}
            />
            {/* Logo medchem flottant */}
            <mesh

                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                ref={logoRef}
                position={[1.6, 0, 1.7]}
                onClick={() => window.open('https://www.medchemstructuregenius.eu/', '_blank')}
            >
                <boxGeometry args={[0.25, 0.25, 0.04]} />
                {/* Tableau de matériaux :
                    0: right, 1: left, 2: top, 3: bottom, 4: front, 5: back
                    Texture sur front (4) et back (5), blanc sur les autres */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    if (i === 4 || i === 5) {
                        return (
                            <meshBasicMaterial
                                key={i}
                                attach={`material-${i}`}
                                map={logoTexture}
                                color={'white'}
                                transparent
                                depthWrite={false}
                            />
                        );
                    } else {
                        return (
                            <meshBasicMaterial
                                key={i}
                                attach={`material-${i}`}
                                color={'#c01f7a'}
                                transparent
                                depthWrite={false}
                            />
                        );
                    }
                })}
            {hovered && (
                <Html center style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.85)',
                        color: 'white',
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: 16,
                        fontWeight: 600,
                        boxShadow: '0 2px 12px #0008',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        transform: 'translateY(-150%)',
                    }}>
                        {'Accéder à l\'application'}
                    </div>
                </Html>
            )}
            </mesh>
        </group>
    );
};

export default HospitalGLTF;
