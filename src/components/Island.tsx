import React, { JSX, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cone, Cylinder, Sphere, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const Island: React.FC = () => {
    const treesRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        // Animation subtile des arbres
        if (treesRef.current) {
            treesRef.current.children.forEach((tree, index) => {
                const time = state.clock.elapsedTime
                tree.rotation.z = Math.sin(time + index) * 0.02
            })
        }
    })

    // Génération des arbres autour de l'île
    const trees: JSX.Element[] = []
    for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2 + (0.5 - Math.random()) * 0.3
        const radius = 5.5 + Math.random() * 1
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const scaleWidth = 0.1 + Math.random() * 0.1
        const scale = 0.5
        const height = (0.8 + Math.random() * 0.4) * scale
        
        trees.push(
            <group key={i} position={[x, height / 1.7, z]}>
                {/* Tronc */}
                <Cylinder args={[0.04, 0.1, height, 6]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#8B4513" />
                </Cylinder>
                {/* Feuillage */}
                <Cone args={[(0.2 + scaleWidth) * scale, height * 0.5, 8 * scale]} position={[0, height * 0.6, 0]}>
                    <meshStandardMaterial color="#228B22" />
                </Cone>
                <Cone args={[(0.25 + scaleWidth) * scale, height * 0.7, 8 * scale]} position={[0, height * 0.4, 0]}>
                    <meshStandardMaterial color="#228B22" />
                </Cone>
                <Cone args={[(0.35 + scaleWidth) * scale, height * 0.8, 8 * scale]} position={[0, height * 0.1, 0]}>
                    <meshStandardMaterial color="#228B22" />
                </Cone>
            </group>
        )
    }

    // Génération de l'herbe
    const grassPatches: JSX.Element[] = []
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 3
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        grassPatches.push(
            <Sphere
                key={i}
                args={[0.05 + Math.random() * 0.03, 4, 3]}
                position={[x, 0.02, z]}
            >
                <meshStandardMaterial color="#32CD32" />
            </Sphere>
        )
    }
    const gltf = useGLTF('models/Island/Island.gltf')

                        // Patch matériaux pour cohérence visuelle et ombres
                        React.useEffect(() => {
                            gltf.scene.traverse((child: any) => {
                                if (child.isMesh) {
                                    // Forcer l'utilisation de MeshStandardMaterial pour une meilleure réactivité à la lumière
                                    const originalMaterial = child.material;
                                    
                                    // Créer un nouveau matériau standard qui réagit bien aux lumières colorées
                                    const newMaterial = new THREE.MeshStandardMaterial({
                                        // Préserver la texture diffuse si elle existe
                                        map: originalMaterial?.map || null,
                                        // Préserver la texture normale si elle existe
                                        normalMap: originalMaterial?.normalMap || null,
                                        // Couleur de base plus neutre pour mieux recevoir les lumières colorées
                                        color: originalMaterial?.color || new THREE.Color('#9a9a9a'),
                                        // Réduire la métallicité pour une meilleure diffusion de la lumière
                                        metalness: 0.05,
                                        // Augmenter la rugosité pour un rendu plus mat
                                        roughness: 0.85,
                                        // Pas d'émission par défaut
                                        emissive: new THREE.Color('#000000'),
                                        emissiveIntensity: 0
                                    });
                                    
                                    // Réduire la taille des textures en augmentant la répétition
                                    if (newMaterial.map) {
                                        newMaterial.map.wrapS = THREE.RepeatWrapping;
                                        newMaterial.map.wrapT = THREE.RepeatWrapping;
                                        newMaterial.map.repeat.set(10, 10); // Réduit la taille des textures
                                    }
                                    if (newMaterial.normalMap) {
                                        newMaterial.normalMap.wrapS = THREE.RepeatWrapping;
                                        newMaterial.normalMap.wrapT = THREE.RepeatWrapping;
                                        newMaterial.normalMap.repeat.set(10, 10); // Réduit la taille des textures normales
                                    }
                                    
                                    child.material = newMaterial;
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            })
                        }, [gltf])
    
                        return (
                            <primitive
                                object={gltf.scene}
                                scale={[0.4, 0.4, 0.4]}
                                position={[0, -0.5, 0]}
                                rotation={[0, -Math.PI / 3, 0]}
                            />
                        )

}

export default Island
