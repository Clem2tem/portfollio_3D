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
        },
        {
            id:'default',
            title: "Salut ! Moi c'est Clément.",
            description: 'Découvrez mes projets et mon univers créatif',
            type: 'special' as const,
            category: 'Introduction'
        }
    ]
    
        // Build items in the requested order: default, popclem, projects..., portal
        const defaultItem = specialItems.find(s => s.id === 'default')
        const popclemItem = specialItems.find(s => s.id === 'popclem')
        const portalItem = specialItems.find(s => s.id === 'portal')

        const items: NavigableItem[] = [
            ...(defaultItem ? [defaultItem] : []),
            ...(popclemItem ? [popclemItem] : []),
            ...projects,
            ...(portalItem ? [portalItem] : [])
        ]

        // Start on the 'default' entry (index 0) per requested order
        const [selectedIndex, setSelectedIndex] = useState<number>(0)
    const selectedItem = items[selectedIndex]

    // navigation helper (delta: -1 or 1) using functional update to avoid stale closures
    const navigate = (delta: number) => {
        try {
            setSelectedIndex(prev => (prev + delta + items.length) % items.length)
        } catch (e) {}
    }

    // keyboard navigation: left/right arrows
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') navigate(-1)
            else if (e.key === 'ArrowRight') navigate(1)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [items.length])

    // global wheel navigation: using a small debounce to avoid fast repeated triggers
    React.useEffect(() => {
        let last = 0
        const THROTTLE_MS = 300
        const onWheel = (e: WheelEvent) => {
            try {
                e.preventDefault()
                const now = performance.now()
                if (now - last < THROTTLE_MS) return
                last = now
                const delta = e.deltaY > 0 ? 1 : -1
                navigate(delta)
            } catch (err) {}
        }
        window.addEventListener('wheel', onWheel, { passive: false } as AddEventListenerOptions)
        return () => window.removeEventListener('wheel', onWheel as any)
    }, [items.length])
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
    const cameraArrivedRef = useRef(false)

    useFrame(() => {
            // Positions de caméra pour chaque élément (vue maquette)
            const itemCameraPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [2, 3, 2],   // Vue sur l'hôpital (côté gauche)
                'SAAS-ERP-EGS': [0, 3, 0],       // Vue sur le projet EGS (côté droit)
                'popclem': [0, 0.5, 1.5],           // Vue sur POPClem
                'portal': [-1, 0.5, -2],            // Vue sur le portail
                'default': [15, 10, 15]           // Vue générale de la maquette
            }

            // Points vers lesquels la caméra doit regarder
            const itemLookAtPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [-6, 1, 7],  // Position de l'hôpital dans la scène
                'SAAS-ERP-EGS': [8, 0, -3],      // Position du projet EGS dans la scène
                'popclem': [-1, 0.3, 1],           // Position approximative de POPClem
                'portal': [0, 0.5, 0],            // Position approximative du portail
                'default': [0, 0, 0]             // Centre de la maquette
            }

            const targetPosition = itemCameraPositions[selectedItem.id] || itemCameraPositions['default']
            const lookAtTarget = itemLookAtPositions[selectedItem.id] || itemLookAtPositions['default']
            
            // Transition fluide vers la nouvelle position
            camera.position.lerp(new THREE.Vector3(...targetPosition), 0.05)
            
            // Transition fluide pour la direction lookAt
            lookAtTargetRef.current.lerp(new THREE.Vector3(...lookAtTarget), 0.05)
            camera.lookAt(lookAtTargetRef.current)

            // When camera is close enough to target position and lookAt target, emit an arrival event once
            try {
                const tp = new THREE.Vector3(...targetPosition)
                const la = new THREE.Vector3(...lookAtTarget)
                const posDist = camera.position.distanceTo(tp)
                const lookDist = lookAtTargetRef.current.distanceTo(la)
                const POS_THRESHOLD = 0.15
                const LOOK_THRESHOLD = 0.2
                if (posDist < POS_THRESHOLD && lookDist < LOOK_THRESHOLD) {
                    if (!cameraArrivedRef.current) {
                        cameraArrivedRef.current = true
                        try {
                            const ev = new CustomEvent('cameraArrived', { detail: { id: selectedItem.id } })
                            window.dispatchEvent(ev)
                        } catch (e) {}
                    }
                } else {
                    // not yet arrived
                }
            } catch (e) {}
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
                    environmentIntensity={0.1}
                    background={true}
                    backgroundIntensity={0.8}
                    blur={0.05}
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
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 w-full px-12">
                {/* Layout en grille selon la maquette */}
                <div className="relative">
                    {/* arrows moved into center column so they flank the central grid area */}

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
                    <div className="col-span-12 lg:col-span-6 space-y-6 relative">
                        {/* Titre */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 pointer-events-auto">
                            <h2 className="text-3xl font-bold mb-2">{selectedItem.title}</h2>
                        </div>
                        {/* Left / Right navigation arrows - flank the center column, vertically centered */}
                        <button
                            aria-label="Précédent"
                            onClick={() => navigate(-1)}
                            className="hidden lg:flex absolute -left-6 lg:-left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/60 hover:bg-slate-700 text-white z-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.293 16.293a1 1 0 010-1.414L15.586 11H4a1 1 0 110-2h11.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <button
                            aria-label="Suivant"
                            onClick={() => navigate(1)}
                            className="hidden lg:flex absolute -right-6 lg:-right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/60 hover:bg-slate-700 text-white z-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.707 3.707a1 1 0 010 1.414L4.414 9H16a1 1 0 110 2H4.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>


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
                                    {selectedItem.id === 'default' && (
                                        <>
                                            <p className="text-sm">Plongez dans une expérience interactive pour découvrir mes projets de développement web et mon univers créatif.</p>
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
                </div>
                {/* close wrapper for arrows + grid */}
            </main>
        </div>
    )
}

export default HomePage
