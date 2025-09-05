import ExcavatorGLTF from './ExcavatorGLTF';

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
                className="w-8 h-8 object-contain rounded cursor-none min-w-[70px] max-w-[70px] min-h-[70px] max-h-[70px] p-1"
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
import { Box, Cone, Html} from '@react-three/drei'
import HospitalGLTF from './HospitalGLTF';
import * as THREE from 'three'
import { projects } from '../data/projects'
import { Project } from '../types/Project'
import { useProjectView } from '../contexts/ProjectViewContext'

interface ProjectBuildingsProps {
  isNightMode?: boolean
}

const ProjectBuildings: React.FC<ProjectBuildingsProps> = ({ isNightMode = false }) => {
    const [hoveredProject, setHoveredProject] = useState<string | null>(null)
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
    // (selection visual effects removed here; selection is handled globally in UI)

    const { setViewedProject } = useProjectView()

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
            // open project in the static UI
            try { setViewedProject(project) } catch (e) { }
            console.log('Project clicked:', project.title)
        }

        const renderBuilding = () => {
            // Ne pas changer l'apparence du bâtiment lors du hover
            const baseColor = isVisible ? '#374151' : '#1f2937';
            const roofColor = isVisible ? '#1f2937' : '#111827';
            // hospitalColor et hospitalRoofColor inutiles avec le modèle GLTF
            const emissiveIntensity = 0;


            switch (project.buildingType) {
                case 'hospital':
                    // Affiche le modèle GLTF CHU
                    return <HospitalGLTF position={project.position} />;
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
                <div className={`${isNightMode ? 'text-white' : 'text-gray-900'} max-w-xl cursor-none`}>
                    <div className={`flex inline-flex items-center gap-2 rounded-lg p-3`}>
                        <div
                            className="flex items-center gap-2 absolute w-[140px] -left-[140px] top-1/2 -translate-y-1/2 pointer-events-auto"
                            style={{ width: 120 }}
                        >
                            <button
                                className={`${isNightMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors px-1 cursor-none`}
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
                                className={`${isNightMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors px-1 cursor-none`}
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
                            <div className={`${isNightMode ? 'text-white' : 'text-gray-900'} text-lg font-oswald font-bold leading-tight mb-1 w-[250px]`}>{hoveredProjectData ? hoveredProjectData.title : ''}</div>
                            <div className={`${isNightMode ? 'text-gray-300' : 'text-gray-600'} text-sm font-oswald mb-2 w-[250px] tracking-wider`}>{hoveredProjectData ? hoveredProjectData.description : ''}</div>
                        </div>
                    </div>
                </div>
            </Html>

            {/* project details moved to UI via ProjectViewContext */}
        </>
    )
}

export default ProjectBuildings
