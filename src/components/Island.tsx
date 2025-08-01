import React, { JSX, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cone, Cylinder, Sphere } from '@react-three/drei'
import * as THREE from 'three'

const Island: React.FC = () => {
    const treesRef = useRef<THREE.Group>(null)
    const grassRef = useRef<THREE.Group>(null)

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

    return (
        <group>
            {/* Base de l'île (terre) */}
            <Cylinder args={[8, 4.5, 9, 16]} position={[0, -4.5, 0]}>
                <meshStandardMaterial color="#8B4513" />
            </Cylinder>

            {/* Surface de l'île (herbe) */}
            <Cylinder args={[7, 4.2, 0.1, 16]} position={[0, 0.05, 0]}>
                <meshStandardMaterial color="#228B22" />
            </Cylinder>

            {/* Chemin circulaire */}
            <Cylinder args={[5.2, 2.8, 0.12, 32]} position={[0, 0.06, 0]}>
                <meshStandardMaterial color="#D2B48C" roughness={0.8} />
            </Cylinder>

            {/* Centre de l'île (plus élevé) */}
            <Cylinder args={[2.5, 4.8, 0.3, 12]} position={[0, 0.15, 0]}>
                <meshStandardMaterial color="#32CD32" />
            </Cylinder>

            {/* Arbres */}
            <group ref={treesRef}>
                {trees}
            </group>

            {/* Patches d'herbe */}
            <group ref={grassRef}>
                {grassPatches}
            </group>

            {/* Rochers décoratifs */}
            <Sphere args={[0.15, 6, 4]} position={[2, 0.08, 1]}>
                <meshStandardMaterial color="#696969" />
            </Sphere>
            <Sphere args={[0.12, 5, 4]} position={[-1.5, 0.06, 2.5]}>
                <meshStandardMaterial color="#778899" />
            </Sphere>
            <Sphere args={[0.1, 4, 3]} position={[1.2, 0.05, -2.8]}>
                <meshStandardMaterial color="#696969" />
            </Sphere>
        </group>
    )
}

export default Island
