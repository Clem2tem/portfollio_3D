// Composant persistant pour l'excavator animé
const ExcavatorGLTF: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const gltf = useGLTF('models/Excavator/Excavator.gltf');
    const anims = useAnimations(gltf.animations, gltf.scene);
    const mixerRef = React.useRef<any>(null);
    const actionsRef = React.useRef<any>(null);
    const lastLoopTimeRef = React.useRef(0);
    const pauseBetweenLoopsRef = React.useRef(false);
    const eventListenerAddedRef = React.useRef(false);

    React.useEffect(() => {
        if (!anims || !gltf || !anims.actions || Object.keys(anims.actions).length === 0) return;
        if (!mixerRef.current) mixerRef.current = anims.mixer;
        if (!actionsRef.current) actionsRef.current = anims.actions;
        if (!eventListenerAddedRef.current && mixerRef.current) {
            mixerRef.current.addEventListener('finished', () => {
                pauseBetweenLoopsRef.current = true;
                lastLoopTimeRef.current = Date.now();
            });
            eventListenerAddedRef.current = true;
        }
        // Lance l'animation si aucune n'est en cours (au tout premier montage)
        const actions = anims.actions;
        let anyPlaying = false;
        Object.values(actions).forEach((action: any) => {
            if (action.isRunning()) anyPlaying = true;
        });
        if (!anyPlaying && !pauseBetweenLoopsRef.current) {
            Object.values(actions).forEach((action: any) => {
                action.reset();
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
                action.play();
            });
        }
    }, [anims, gltf]);

    useFrame((_, delta) => {
        if (mixerRef.current) {
            if (pauseBetweenLoopsRef.current) {
                const now = Date.now();
                const pauseDuration = 1000;
                if (now - lastLoopTimeRef.current >= pauseDuration) {
                    Object.values(actionsRef.current || {}).forEach((action: any) => {
                        action.reset();
                        action.play();
                    });
                    pauseBetweenLoopsRef.current = false;
                }
            } else {
                mixerRef.current.update(delta * 0.5);
            }
        }
    });

    React.useEffect(() => {
        // Patch matériaux pour cohérence visuelle et ombres (une seule fois)
        if (!gltf) return;
        gltf.scene.traverse((child: any) => {
            if (child.isMesh) {
                const originalMaterial = child.material;
                const newMaterial = new THREE.MeshStandardMaterial({
                    map: originalMaterial?.map || null,
                    normalMap: originalMaterial?.normalMap || null,
                    color: originalMaterial?.color || new THREE.Color('#a0a0a0'),
                    metalness: 0.1,
                    roughness: 0.8,
                    emissive: new THREE.Color('#000000'),
                    emissiveIntensity: 0
                });
                child.material = newMaterial;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [gltf]);

    if (!gltf) return null;
    return (
        <primitive
            object={gltf.scene}
            scale={[0.4, 0.4, 0.4]}
            position={position}
            rotation={[0, -Math.PI / 3, 0]}
        />
    );
};
// Composant pour gérer l'affichage du logo techno avec fallback texte
type TechLogoProps = {
    tech: string;
};

const TechLogo: React.FC<TechLogoProps> = ({ tech }) => {
    const techKey = tech.replace(/\s+/g, "_");
    const pngPath = `/logos/${techKey}.png`;
    const jpgPath = `/logos/${techKey}.jpg`;
    const svgPath = `/logos/${techKey}.svg`;
    const [imgSrc, setImgSrc] = React.useState<string | null>(pngPath);
    React.useEffect(() => {
        setImgSrc(pngPath);
    }, [tech]);
    if (imgSrc) {
        return (
            <img
                src={imgSrc}
                alt={tech}
                className="w-8 h-8 object-contain rounded shadow cursor-none min-w-[70px] max-w-[70px] min-h-[70px] max-h-[70px] p-1"
                onError={() => {
                    if (imgSrc === pngPath) setImgSrc(jpgPath);
                    else if (imgSrc === jpgPath) setImgSrc(svgPath);
                    else setImgSrc(null);
                }}
                style={{ display: imgSrc ? 'inline-block' : 'none' }}
            />
        );
    }
    return (
        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded cursor-none min-w-[70px] w-[70px] max-w-[70px] text-center">
            {tech}
        </span>
    );
};
import React, { useState, useRef } from 'react'

import { useFrame, useThree } from '@react-three/fiber'
import { Box, Cone, Html, useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { projects } from '../data/projects'
import { Project } from '../types/Project'

const ProjectBuildings: React.FC = () => {
    const [hoveredProject, setHoveredProject] = useState<string | null>(null)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const { camera } = useThree()
    const buildingsRef = useRef<THREE.Group>(null)

    useFrame(() => {
        // Animation de flottement pour les bâtiments survolés
        if (buildingsRef.current) {
            buildingsRef.current.children.forEach((building) => {

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
        // Calcul de la visibilité, mais ne doit pas impacter l'animation
        useFrame((state) => {
            if (meshRef.current) {
                const worldPos = new THREE.Vector3()
                meshRef.current.getWorldPosition(worldPos)
                const cameraDirection = new THREE.Vector3()
                state.camera.getWorldDirection(cameraDirection)
                const toBuildingDirection = new THREE.Vector3()
                toBuildingDirection.subVectors(worldPos, state.camera.position).normalize()
                const dot = cameraDirection.dot(toBuildingDirection)
                setIsVisible(dot > -0.3)
            }
        })

        const handleClick = (event: any) => {
            if (!isVisible) return
            event.stopPropagation()
            // setSelectedProject(project)
            console.log('Project clicked:', project.title)
        }

        const renderBuilding = () => {
            // Ne pas changer l'apparence du bâtiment lors du hover
            const baseColor = isVisible ? '#374151' : '#1f2937';
            const roofColor = isVisible ? '#1f2937' : '#111827';
            const hospitalColor = isVisible ? '#A1C2E8' : '#374151';
            const hospitalRoofColor = isVisible ? '#9ca3af' : '#111827';
            const emissiveIntensity = 0;


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
                                emissiveIntensity={0.2}
                            />
                        </Box>
                        <Box args={[0.4, 0.1, 0.05]} position={[0, 0.9, 0.41]}>
                            <meshStandardMaterial
                                color="#ef4444"
                                emissive="#ef4444"
                                emissiveIntensity={0.2}
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
                                    emissiveIntensity={0.4}
                                />
                            </Box>
                        ))}
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Box key={i + 6} args={[0.15, 0.15, 0.02]} position={[0.2, 0.3 + i * 0.2, 0.31]}>
                                <meshStandardMaterial
                                    color="#fbbf24"
                                    emissive="#fbbf24"
                                    emissiveIntensity={0.4}
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
            case 'factory':
                // On ne rend rien ici, le modèle animé est monté globalement
                return null;
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
            </group>
        )
    }

    useFrame(() => {
        // Gestion du hover pour tous les bâtiments SAUF l'usine (factory)
        if (buildingsRef.current) {
            buildingsRef.current.children.forEach((building, index) => {
                const project = projects[index];
                if (project.buildingType === 'factory') return; // On gère l'usine à part
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
                    if (hoveredProject !== project.id) {
                        setTechIndex(0); // Reset tech index when hovering a new project
                    }
                    setHoveredProject(project.id);
                } else if (hoveredProject === project.id) {
                    setHoveredProject(null);
                }
            });
        }

        // Gestion du hover pour l'excavator (usine)
        const factory = projects.find(p => p.buildingType === 'factory');
        if (factory) {
            // Centre de la scène (0,0,0)
            const center = new THREE.Vector3(0, 0, 0);
            const excavatorPos = new THREE.Vector3(...factory.position);
            // Vecteur du centre vers excavator
            const dirToExcavator = excavatorPos.clone().sub(center).setY(0).normalize();
            // Vecteur du centre vers la caméra
            const camPos = camera.position.clone();
            const dirToCamera = camPos.clone().sub(center).setY(0).normalize();
            // Calcul de l'angle entre les deux vecteurs
            const angle = dirToExcavator.angleTo(dirToCamera); // en radians
            const angleThreshold = Math.PI / 12; // ~15°
            if (angle < angleThreshold) {
                if (hoveredProject !== factory.id) {
                    setTechIndex(0);
                }
                setHoveredProject(factory.id);
            } else if (hoveredProject === factory.id) {
                setHoveredProject(null);
            }
        }
    });

    // Affichage de la bulle d'infos projet survolé en haut de l'écran

    // On garde en mémoire le dernier hoveredProjectData et techIndex valides
    const [techIndex, setTechIndex] = useState(0);
    const [lastHoveredProjectData, setLastHoveredProjectData] = useState<Project | null>(null);
    const hoveredProjectData = projects.find(p => p.id === hoveredProject) || lastHoveredProjectData;

    React.useEffect(() => {
        const found = projects.find(p => p.id === hoveredProject);
        if (found) {
            setLastHoveredProjectData(found);
        }
    }, [hoveredProject]);

    // Chercher la position du projet factory
    const factoryProject = projects.find(p => p.buildingType === 'factory');
    return (
        <>
            <group ref={buildingsRef}>
                {projects.map((project) => (
                    <BuildingComponent key={project.id} project={project} />
                ))}
            </group>
            {/* On monte le modèle excavator animé une seule fois, à la bonne position */}
            {factoryProject && <ExcavatorGLTF position={factoryProject.position} />}

            {/* Bulle d'infos projet survolé, statique en haut de l'écran */}
            <Html
                as="div"
                center
                occlude={false}
                className="cursor-none"
                style={{
                    position: 'fixed',
                    top: "-45vh",
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    pointerEvents: 'auto',
                    width: 'auto',
                    opacity: hoveredProject ? 1 : 0,
                    transition: 'opacity 0.2s ease-in-out',
                }}
            >
                    <div className="text-white max-w-xl cursor-none">
                        <div className='flex inline-flex items-center gap-2'>
                            <div
                                className="flex items-center gap-2 absolute w-[140px] -left-[140px] top-1/2 -translate-y-1/2 pointer-events-auto"
                                style={{ width: 120 }}
                            >
                                <button
                                    className="text-gray-400 hover:text-white transition-colors px-1 cursor-none"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setTechIndex((prev) => {
                                            if (!hoveredProjectData || !hoveredProjectData.technologies) return 0;
                                            return prev === 0
                                                ? hoveredProjectData.technologies.length - 1
                                                : prev - 1;
                                        });
                                    }}
                                    tabIndex={-1}
                                    aria-label="Précédent"
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                {hoveredProjectData && hoveredProjectData.technologies ? (
                                    <TechLogo tech={hoveredProjectData.technologies[techIndex] || hoveredProjectData.technologies[0]} />
                                ) : null}
                                <button
                                    className="text-gray-400 hover:text-white transition-colors px-1 cursor-none"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setTechIndex((prev) => {
                                            if (!hoveredProjectData || !hoveredProjectData.technologies) return 0;
                                            return prev === hoveredProjectData.technologies.length - 1
                                                ? 0
                                                : prev + 1;
                                        });
                                    }}
                                    tabIndex={-1}
                                    aria-label="Suivant"
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            <div>
                                <div className="text-white text-lg font-oswald font-bold leading-tight mb-1 w-[250px]">{hoveredProjectData ? hoveredProjectData.title : ''}</div>
                                <div className="text-sm text-gray-300 font-oswald mb-2 w-[250px] tracking-wider">{hoveredProjectData ? hoveredProjectData.description : ''}</div>
                            </div>
                        </div>
                    </div>
            </Html>

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
                        zIndex: 50
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
