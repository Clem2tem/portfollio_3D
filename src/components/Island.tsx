import React from 'react'
import {useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const Island: React.FC = () => {

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
