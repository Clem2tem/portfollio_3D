import React, { useState, Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { projects } from '../data/projects'
import type { Project } from '../types/Project'
import * as THREE from 'three'

// Import des composants 3D
import SVGLogo3D from './SVGLogo3D'
import Island from './Island'
import Desk from './Desk'
import ProjectBuildings from './ProjectBuildings'
import Lighting from './Lighting'
import Portal from './Portal'
import POPClemGLTF from './POPClemGLTF'
import POPClemStatic from './POPClemStatic'

interface HomePageProps {
    onEnter3DMode: () => void
}

// Type pour les éléments navigables (projets + éléments spéciaux)
type NavigableItem = Project | {
    id: string
    title: string
    description: string
    type: 'special'
    category: string
}

const HomePage: React.FC<HomePageProps> = ({ onEnter3DMode }) => {
    // Éléments spéciaux navigables
    const specialItems = [
        {
            id: 'popclem',
            title: 'POPClem',
            description: 'Personnage 3D interactif - Explorez le monde avec votre avatar personnalisé',
            type: 'special' as const,
            category: 'Avatar 3D'
        },
        {
            id: 'portal',
            title: 'Portail',
            description: 'Portail vers le monde 3D interactif - Entrez dans l\'expérience immersive',
            type: 'special' as const,
            category: 'Navigation 3D'
        }
    ]

    // Tous les éléments navigables (projets + éléments spéciaux)
    const allNavigableItems: NavigableItem[] = [...projects, ...specialItems]
    
    const [selectedItem, setSelectedItem] = useState<NavigableItem>(projects[0])
    const [logoMousePosition, setLogoMousePosition] = useState({ x: 0.5, y: 0.5 })
    const logoCanvasRef = useRef<HTMLDivElement>(null)
    
    // Fonction helper pour vérifier si l'item sélectionné est un projet
    const isProject = (item: NavigableItem): item is Project => {
        return 'technologies' in item
    }
    
    // Référence pour la transition fluide du lookAt (persistante entre les re-rendus)
    const lookAtTargetRef = useRef(new THREE.Vector3(-6, 1, 7)) // Initialisé avec la position du premier projet

    // Composant pour gérer la transition de caméra vers les projets
    const CameraController = () => {
        const { camera } = useThree()
        
        useFrame(() => {
            // Positions de caméra pour chaque élément (vue maquette)
            const itemCameraPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [2, 3, 2],   // Vue sur l'hôpital (côté gauche)
                'SAAS-ERP-EGS': [0, 3, 0],       // Vue sur le projet EGS (côté droit)
                'popclem': [-3, 4, 3],           // Vue sur POPClem
                'portal': [3, 5, -2],            // Vue sur le portail
                'default': [0, 10, 15]           // Vue générale de la maquette
            }

            // Points vers lesquels la caméra doit regarder
            const itemLookAtPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [-6, 1, 7],  // Position de l'hôpital dans la scène
                'SAAS-ERP-EGS': [8, 0, -3],      // Position du projet EGS dans la scène
                'popclem': [-2, 0, 2],           // Position approximative de POPClem
                'portal': [2, 1, -1],            // Position approximative du portail
                'default': [0, 0, 0]             // Centre de la maquette
            }

            const targetPosition = itemCameraPositions[selectedItem.id] || itemCameraPositions['default']
            const lookAtTarget = itemLookAtPositions[selectedItem.id] || itemLookAtPositions['default']
            
            // Transition fluide vers la nouvelle position
            camera.position.lerp(new THREE.Vector3(...targetPosition), 0.02)
            
            // Transition fluide pour la direction lookAt
            lookAtTargetRef.current.lerp(new THREE.Vector3(...lookAtTarget), 0.02)
            camera.lookAt(lookAtTargetRef.current)
        })
        
        return null
    }

    // Composant pour contrôler la caméra du logo avec la souris
    const LogoCameraController = () => {
        const { camera } = useThree()
        
        useFrame(() => {
            // Convertir la position relative de la souris sur le canvas en rotation de caméra
            const x = logoMousePosition.x * 2 - 1 // -1 à 1
            const y = -(logoMousePosition.y * 2 - 1) // -1 à 1 (inversé pour Y)
            
            // Calculer la position de la caméra en orbite
            const radius = 3
            const theta = x * Math.PI * 0.3 // Rotation horizontale limitée
            const phi = y * Math.PI * 0.1 + Math.PI * 0.5 // Rotation verticale limitée
            
            camera.position.x = radius * Math.sin(phi) * Math.cos(theta)
            camera.position.y = radius * Math.cos(phi)
            camera.position.z = radius * Math.sin(phi) * Math.sin(theta)
            
            camera.lookAt(0, 0, 0)
        })
        
        return null
    }

    // Handler pour le mouvement de souris sur le canvas du logo
    const handleLogoCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const canvas = event.currentTarget
        const rect = canvas.getBoundingClientRect()
        
        // Position relative au canvas (0-1)
        const x = (event.clientX - rect.left) / rect.width
        const y = (event.clientY - rect.top) / rect.height
        
        setLogoMousePosition({ x, y })
    }

    // Handler pour quand la souris quitte le canvas (retour au centre)
    const handleLogoCanvasMouseLeave = () => {
        setLogoMousePosition({ x: 0.5, y: 0.5 })
    }

    // Fonction pour rendre la scène maquette complète
    const renderMaquetteScene = () => {
        return (
            <>
                {/* Éclairage de la maquette */}
                <Lighting />
                
                {/* L'île comme base de la maquette */}
                <Island />
                
                {/* Le desk avec tous les projets */}
                <Desk />

                <POPClemStatic />

                {/* Tous les bâtiments/projets positionnés sur la maquette */}
                <ProjectBuildings />
                
                {/* Environnement HDRI pour l'éclairage global */}
                <Environment 
                    files="/hdri/office.hdr" 
                    environmentIntensity={0}
                    background={true}
                    backgroundIntensity={0.8}
                />

                <Portal />
            </>
        )
    }

    return (
        <div className="min-h-screen text-white">

            {/* Canvas 3D en arrière-plan */}
            <div className="absolute z-[-1] inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <Canvas
                    camera={{ position: [0, 10, 15], fov: 60 }}
                    className="w-full h-full"
                >
                    <Suspense fallback={null}>
                        {/* Contrôleur de caméra pour les transitions vers les projets */}
                        <CameraController />
                        
                        {/* Scène maquette complète */}
                        {renderMaquetteScene()}
                    </Suspense>
                </Canvas>
            </div>
            {/* Header */}
            <header className="relative z-50 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Clément DT</h1>
                        <p className="text-slate-400">Développeur Fullstack</p>
                    </div>
                    <button
                        onClick={onEnter3DMode}
                        className="relative z-50 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                        Mode 3D Interactif
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 w-full px-12">
                {/* Layout en grille selon la maquette */}
                <div className="grid grid-cols-12 gap-6 h-[calc(100dvh-150px)] w-full">
                    {/* Description - Colonne gauche */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 h-full border border-slate-700">
                            <h3 className="text-xl font-semibold mb-4">Description</h3>
                            <div className="space-y-4 text-slate-300">
                                <p>{selectedItem.description}</p>
                                {isProject(selectedItem) && selectedItem.details?.challenge && (
                                    <div>
                                        <h4 className="font-medium text-white mb-2">Défi</h4>
                                        <p className="text-sm">{selectedItem.details.challenge}</p>
                                    </div>
                                )}
                                {isProject(selectedItem) && selectedItem.details?.solution && (
                                    <div>
                                        <h4 className="font-medium text-white mb-2">Solution</h4>
                                        <p className="text-sm">{selectedItem.details.solution}</p>
                                    </div>
                                )}
                                <div className="flex gap-4 pt-4">
                                    {isProject(selectedItem) && selectedItem.liveUrl && (
                                        <a
                                            href={selectedItem.liveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                                        >
                                            Voir le projet
                                        </a>
                                    )}
                                    {isProject(selectedItem) && selectedItem.githubUrl && (
                                        <a
                                            href={selectedItem.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                                        >
                                            Code source
                                        </a>
                                    )}
                                    {selectedItem.id === 'portal' && (
                                        <button
                                            onClick={onEnter3DMode}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                                        >
                                            Entrer dans le portail
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Zone centrale - Titre et espace 3D */}
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* Titre */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 pointer-events-auto">
                            <h2 className="text-3xl font-bold mb-2">{selectedItem.title}</h2>
                            <p className="text-slate-400 mb-4">{selectedItem.category}</p>

                            {/* Navigation entre tous les éléments */}
                            <div className="space-y-3">
                                {/* Projets */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-2">Projets</h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {projects.map((project) => (
                                            <button
                                                key={project.id}
                                                onClick={() => setSelectedItem(project)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${selectedItem.id === project.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {project.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Éléments spéciaux */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-2">Exploration 3D</h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {specialItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setSelectedItem(item)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${selectedItem.id === item.id
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {item.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* Colonne droite */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        {/* Technologies - Uniquement pour les projets */}
                        {isProject(selectedItem) && (
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                                <h4 className="text-lg font-semibold mb-4">Technologies</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedItem.technologies.map((tech: string, index: number) => (
                                        <div
                                            key={index}
                                            className="bg-slate-700/50 rounded-lg p-3 text-center border border-slate-600"
                                        >
                                            <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                                                <span className="text-xs font-bold">{tech.charAt(0)}</span>
                                            </div>
                                            <p className="text-sm font-medium">{tech}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fonctionnalités Techniques - Uniquement pour les projets */}
                        {isProject(selectedItem) && (
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                                <h4 className="text-lg font-semibold mb-4">Fonctionnalités</h4>
                                <div className="space-y-3">
                                    {selectedItem.details?.features?.map((feature: string, index: number) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                            <p className="text-sm text-slate-300">{feature}</p>
                                        </div>
                                    )) || (
                                            <p className="text-slate-400 text-sm">Fonctionnalités en cours de documentation...</p>
                                        )}
                                </div>
                            </div>
                        )}

                        {/* Informations spéciales pour les éléments non-projets */}
                        {!isProject(selectedItem) && (
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                                <h4 className="text-lg font-semibold mb-4">À propos</h4>
                                <div className="space-y-3 text-slate-300">
                                    {selectedItem.id === 'popclem' && (
                                        <>
                                            <p className="text-sm">POPClem est votre avatar dans le monde 3D. Naviguez librement et explorez tous les projets en mode immersif.</p>
                                            <div className="mt-4">
                                                <h5 className="font-medium text-white mb-2">Contrôles</h5>
                                                <ul className="text-sm space-y-1">
                                                    <li>• WASD : Déplacement</li>
                                                    <li>• Souris : Regarder autour</li>
                                                    <li>• Clic : Interagir</li>
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                    {selectedItem.id === 'portal' && (
                                        <>
                                            <p className="text-sm">Le portail vous transporte directement dans l'expérience 3D interactive où vous pouvez explorer librement tous les projets.</p>
                                            <div className="mt-4 p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
                                                <p className="text-sm text-purple-200">🌟 Mode interactif recommandé pour une expérience complète</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Logo en 3D */}
                        <div 
                            ref={logoCanvasRef}
                        >
                            <Canvas
                                camera={{ position: [3, 1, 0], fov: 50 }}
                                className="w-full h-full"
                                onMouseMove={handleLogoCanvasMouseMove}
                                onMouseLeave={handleLogoCanvasMouseLeave}
                            >
                                <LogoCameraController />
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} />
                                <SVGLogo3D
                                    url={"/logos/EGS.svg"}
                                    position={[0, 0, 0]}
                                    scale={0.005}
                                    onClick={() => window.open('https://egs.fr', '_blank')}
                                    private={true}
                                    rotate={false}
                                    hoverEffect={false}
                                />
                            </Canvas>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default HomePage
