import React, { useState, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Box, Cone, Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { projects } from '../data/projects'
import { Project } from '../types/Project'

const ProjectBuildings: React.FC = () => {
    const [hoveredProject, setHoveredProject] = useState<string | null>(null)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const { camera } = useThree()
    const buildingsRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        // Animation de flottement pour les bâtiments survolés
        if (buildingsRef.current) {
            buildingsRef.current.children.forEach((building, index) => {
                const project = projects[index]
                if (project && hoveredProject === project.id) {
                    building.position.y = project.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
                } else if (project) {
                    building.position.y = THREE.MathUtils.lerp(
                        building.position.y,
                        project.position[1],
                        0.1
                    )
                }

                // Orientation des bâtiments pour qu'ils regardent vers l'extérieur
                const worldPos = new THREE.Vector3()
                building.getWorldPosition(worldPos)
                const angle = Math.atan2(worldPos.x, worldPos.z)
                building.rotation.y = angle
            })
        }
    })
    selectedProject && useFrame(() => {
        // if (buildingsRef.current) {
        //     buildingsRef.current.children.forEach((building, index) => {
        //         const project = projects[index]
        //         if (project && selectedProject.id === project.id) {
        //             building.scale.set(1.1, 1.1, 1.1)
        //         } else if (project) {
        //             building.scale.set(1, 1, 1)
        //         }
        //     })
        // }
    })

    const BuildingComponent: React.FC<{ project: Project }> = ({ project }) => {
        const meshRef = useRef<THREE.Group>(null)
        const [isVisible, setIsVisible] = useState(true)

        useFrame((state) => {
            if (meshRef.current) {
                // Calculer si le bâtiment est visible depuis la caméra
                const worldPos = new THREE.Vector3()
                meshRef.current.getWorldPosition(worldPos)

                const cameraDirection = new THREE.Vector3()
                state.camera.getWorldDirection(cameraDirection)

                const toBuildingDirection = new THREE.Vector3()
                toBuildingDirection.subVectors(worldPos, state.camera.position).normalize()

                // Calculer l'angle entre la direction de la caméra et la direction vers le bâtiment
                const dot = cameraDirection.dot(toBuildingDirection)

                // Si l'angle est > 90 degrés (dot < 0), le bâtiment est derrière
                setIsVisible(dot > -0.3) // Petit buffer pour plus de souplesse
            }
        })

        const handleClick = (event: any) => {
            if (!isVisible) return
            event.stopPropagation()
            // setSelectedProject(project)
            console.log('Project clicked:', project.title)
        }

        const renderBuilding = () => {
            const isHovered = hoveredProject === project.id && isVisible
            const baseColor = isHovered ? '#3b82f6' : (isVisible ? '#374151' : '#1f2937')
            const roofColor = isHovered ? '#1d4ed8' : (isVisible ? '#1f2937' : '#111827')
            const hospitalColor = isHovered ? '#3b82f6' : (isVisible ? '#A1C2E8' : '#374151')
            const hospitalRoofColor = isHovered ? '#1d4ed8' : (isVisible ? '#9ca3af' : '#111827')
            const emissiveIntensity = isHovered && isVisible ? 0.3 : 0

            switch (project.buildingType) {
                case 'hospital':
                    return (
                        <>
                            {/* Corps principal */}
                            <Box args={[0.8, 1.2, 0.8]} position={[0, 0.6, 0]}>
                                <meshStandardMaterial
                                    color={hospitalColor}
                                    emissive={hospitalColor}
                                    emissiveIntensity={emissiveIntensity}
                                />
                            </Box>
                            {/* Croix rouge */}
                            <Box args={[0.1, 0.4, 0.05]} position={[0, 0.9, 0.41]}>
                                <meshStandardMaterial
                                    color="#ef4444"
                                    emissive="#ef4444"
                                    emissiveIntensity={isHovered ? 0.5 : 0.2}
                                />
                            </Box>
                            <Box args={[0.4, 0.1, 0.05]} position={[0, 0.9, 0.41]}>
                                <meshStandardMaterial
                                    color="#ef4444"
                                    emissive="#ef4444"
                                    emissiveIntensity={isHovered ? 0.5 : 0.2}
                                />
                            </Box>
                            {/* Toit */}
                            <Box args={[0.9, 0.2, 0.9]} position={[0, 1.3, 0]}>
                                <meshStandardMaterial
                                    color={hospitalRoofColor}
                                    emissive={hospitalRoofColor}
                                    emissiveIntensity={emissiveIntensity}
                                />
                            </Box>
                        </>
                    )

                case 'office':
                    return (
                        <>
                            {/* Tour principale */}
                            <Box args={[0.6, 1.5, 0.6]} position={[0, 0.75, 0]}>
                                <meshStandardMaterial
                                    color={baseColor}
                                    emissive={baseColor}
                                    emissiveIntensity={emissiveIntensity}
                                />
                            </Box>
                            {/* Fenêtres */}
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Box key={i} args={[0.15, 0.15, 0.02]} position={[-0.2, 0.3 + i * 0.2, 0.31]}>
                                    <meshStandardMaterial
                                        color="#fbbf24"
                                        emissive="#fbbf24"
                                        emissiveIntensity={isHovered ? 0.8 : 0.4}
                                    />
                                </Box>
                            ))}
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Box key={i + 6} args={[0.15, 0.15, 0.02]} position={[0.2, 0.3 + i * 0.2, 0.31]}>
                                    <meshStandardMaterial
                                        color="#fbbf24"
                                        emissive="#fbbf24"
                                        emissiveIntensity={isHovered ? 0.8 : 0.4}
                                    />
                                </Box>
                            ))}
                        </>
                    )

                case 'school':
                    return (
                        <>
                            {/* Bâtiment principal */}
                            <Box args={[1, 0.8, 0.8]} position={[0, 0.4, 0]}>
                                <meshStandardMaterial
                                    color={baseColor}
                                    emissive={baseColor}
                                    emissiveIntensity={emissiveIntensity}
                                />
                            </Box>
                            {/* Toit en pente */}
                            <Cone args={[0.8, 0.4, 4]} position={[0, 1, 0]} rotation={[0, Math.PI / 4, 0]}>
                                <meshStandardMaterial
                                    color={roofColor}
                                    emissive={roofColor}
                                    emissiveIntensity={emissiveIntensity}
                                />
                            </Cone>
                            {/* Clocher */}
                            <Box args={[0.2, 0.6, 0.2]} position={[0.3, 1, 0]}>
                                <meshStandardMaterial
                                    color={baseColor}
                                    emissive={baseColor}
                                    emissiveIntensity={emissiveIntensity}
                                />
                            </Box>
                        </>
                    )

                case 'factory': {
                    // Charge le modèle GLTF avec le hook dédié
                    const gltf = useGLTF('models/Excavator.glb')

                    // Patch matériaux pour cohérence visuelle et ombres
                    React.useEffect(() => {
                        gltf.scene.traverse((child: any) => {
                            if (child.isMesh) {
                                // Matériau partagé pour le thème
                                if (!child.material || !child.material.color) {
                                    child.material = new THREE.MeshStandardMaterial({
                                        color: '#b0b0b0',
                                        metalness: 0.5,
                                        roughness: 0.6
                                    })
                                }
                                child.castShadow = true
                                child.receiveShadow = true
                            }
                        })
                    }, [gltf])

                    return (
                        <primitive
                            object={gltf.scene}
                            scale={[0.7, 0.7, 0.7]}
                            position={[0, 0, 0]}
                            rotation={[0, -Math.PI / 3, 0]}
                        />
                    )
                }

                default:
                    return (
                        <Box args={[0.8, 1, 0.8]} position={[0, 0.5, 0]}>
                            <meshStandardMaterial
                                color={baseColor}
                                emissive={baseColor}
                                emissiveIntensity={emissiveIntensity}
                            />
                        </Box>
                    )
            }
        }

        return (
            <group
                ref={meshRef}
                position={project.position}
                onClick={handleClick}
            >
                {renderBuilding()}

                {/* Bulle de dialogue au survol */}
                {hoveredProject === project.id && isVisible && (
                    <Html
                        position={[1, 1, 0]}
                        center
                        distanceFactor={10}
                        occlude={false}
                    >
                        <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600 max-w-xs">
                            <div className="text-sm font-semibold mb-1">{project.title}</div>
                            <div className="text-xs text-gray-300 mb-2">{project.description}</div>
                            <div className="flex flex-wrap gap-1">
                                {project.technologies.slice(0, 3).map((tech, i) => (
                                    <span key={i} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                        {tech}
                                    </span>
                                ))}
                                {project.technologies.length > 3 && (
                                    <span className="text-xs text-gray-400">+{project.technologies.length - 3}</span>
                                )}
                            </div>
                        </div>
                    </Html>
                )}
            </group>
        )
    }

    useFrame(() => {
        if (buildingsRef.current) {
            buildingsRef.current.children.forEach((building, index) => {
                const project = projects[index];
                let hovered = false;
                building.traverse((child: any) => {
                    if (child.isMesh) {
                        const worldPos = new THREE.Vector3();
                        child.getWorldPosition(worldPos);
                        const angleDiff = Math.atan2(worldPos.x, worldPos.z) - Math.atan2(camera.position.x, camera.position.z);
                        if (Math.abs(angleDiff) < Math.PI / 12) {
                            hovered = true;
                        }
                    }
                });
                if (hovered) {
                    setHoveredProject(project.id);
                } else if (hoveredProject === project.id) {
                    setHoveredProject(null);
                }
            });
        }
    });

    return (
        <>
            <group ref={buildingsRef}>
                {projects.map((project) => (
                    <BuildingComponent key={project.id} project={project} />
                ))}
            </group>
            
            {/* Popup pour le projet sélectionné */}
            {selectedProject && (
                <Html
                    position={[0, 0, 0]}
                    center
                    distanceFactor={1}
                    transform={false}
                    occlude={false}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        pointerEvents: 'auto',
                        zIndex: 1000
                    }}
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">{selectedProject.title}</h2>
                                        <p className="text-gray-300">{selectedProject.description}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedProject(null)}
                                        className="text-gray-400 hover:text-white transition-colors ml-4"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Technologies */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-white mb-3">Technologies utilisées</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProject.technologies.map((tech, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-full text-sm"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Links */}
                                <div className="flex flex-wrap gap-3">
                                    {selectedProject.githubUrl && (
                                        <a
                                            href={selectedProject.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                        >
                                            GitHub
                                        </a>
                                    )}
                                    {selectedProject.liveUrl && (
                                        <a
                                            href={selectedProject.liveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        >
                                            Voir le projet
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Html>
            )}
        </>
    )
}

export default ProjectBuildings
