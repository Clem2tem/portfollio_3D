import React, { useState, Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
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

interface HomePageProps {
    onEnter3DMode: () => void
}

const HomePage: React.FC<HomePageProps> = ({ onEnter3DMode }) => {
    const [selectedProject, setSelectedProject] = useState<Project>(projects[0])
    const [logoMousePosition, setLogoMousePosition] = useState({ x: 0.5, y: 0.5 })
    const logoCanvasRef = useRef<HTMLDivElement>(null)

    // Composant pour gérer la transition de caméra vers les projets
    const CameraController = () => {
        const { camera } = useThree()
        
        useFrame(() => {
            // Positions de caméra pour chaque projet (vue maquette)
            const projectCameraPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [8, 6, 8],   // Vue sur l'hôpital
                'SAAS-ERP-EGS': [0, 8, 12],      // Vue centrale sur la maison + excavatrice
                'popclem': [-8, 6, 8],           // Vue sur POPClem
                'default': [0, 10, 15]           // Vue générale de la maquette
            }

            const targetPosition = projectCameraPositions[selectedProject.id] || projectCameraPositions['default']
            
            // Transition fluide vers la nouvelle position
            camera.position.lerp(new THREE.Vector3(...targetPosition), 0.02)
            
            // La caméra regarde toujours le centre de la maquette
            camera.lookAt(0, 0, 0)
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
                
                {/* Tous les bâtiments/projets positionnés sur la maquette */}
                <ProjectBuildings />
                
                {/* Environnement pour l'éclairage global */}
                <Environment preset="warehouse" environmentIntensity={0.3}/>

                <Portal />
            </>
        )
    }

    return (
        <div className="min-h-screen text-white">

            {/* ==================== POINTER EVENTS TEMPORAIRE POUR ORBIT CONTROLS ==================== */}
            <div className="absolute z-[5] inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                {/* NOTE: z-index pour permettre interaction OrbitControls mais en dessous du contenu UI */}
                <Canvas
                    camera={{ position: [0, 10, 15], fov: 60 }}
                    className="w-full h-full"
                    style={{ pointerEvents: 'auto' }}
                    onPointerMove={(e) => console.log('Canvas pointer move:', e.clientX, e.clientY)}
                    onPointerDown={() => console.log('Canvas pointer down')}
                >
                    <Suspense fallback={null}>
                        {/* ==================== ORBIT CONTROLS - TEMPORAIRE ==================== */}
                        {/* TODO: SUPPRIMER CES ORBIT CONTROLS PLUS TARD */}
                        <OrbitControls
                            enablePan={true}
                            enableZoom={true}
                            enableRotate={true}
                            minDistance={5}
                            maxDistance={50}
                            minPolarAngle={0}
                            maxPolarAngle={Math.PI / 2}
                            dampingFactor={0.05}
                            enableDamping={true}
                            rotateSpeed={1.0}
                            zoomSpeed={1.2}
                            panSpeed={1.0}
                            screenSpacePanning={false}
                        />
                        {/* ==================== FIN ORBIT CONTROLS - TEMPORAIRE ==================== */}
                        
                        {/* Contrôleur de caméra pour les transitions */}
                        {/* NOTE: DESACTIVE TEMPORAIREMENT A CAUSE DES ORBIT CONTROLS */}
                        {/* <CameraController /> */}
                        
                        {/* Scène maquette complète */}
                        {renderMaquetteScene()}
                    </Suspense>
                </Canvas>
            </div>
            {/* ==================== FIN POINTER EVENTS TEMPORAIRE ==================== */}
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
            <main className="relative z-10 w-full px-12 pointer-events-none">
                {/* Layout en grille selon la maquette */}
                <div className="grid grid-cols-12 gap-6 h-[calc(100dvh-150px)] w-full">
                    {/* Description - Colonne gauche */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 h-full border border-slate-700 pointer-events-auto">
                            <h3 className="text-xl font-semibold mb-4">Description</h3>
                            <div className="space-y-4 text-slate-300">
                                <p>{selectedProject.description}</p>
                                {selectedProject.details?.challenge && (
                                    <div>
                                        <h4 className="font-medium text-white mb-2">Défi</h4>
                                        <p className="text-sm">{selectedProject.details.challenge}</p>
                                    </div>
                                )}
                                {selectedProject.details?.solution && (
                                    <div>
                                        <h4 className="font-medium text-white mb-2">Solution</h4>
                                        <p className="text-sm">{selectedProject.details.solution}</p>
                                    </div>
                                )}
                                <div className="flex gap-4 pt-4">
                                    {selectedProject.liveUrl && (
                                        <a
                                            href={selectedProject.liveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                                        >
                                            Voir le projet
                                        </a>
                                    )}
                                    {selectedProject.githubUrl && (
                                        <a
                                            href={selectedProject.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                                        >
                                            Code source
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Zone centrale - Titre et espace 3D */}
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* Titre */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 pointer-events-auto">
                            <h2 className="text-3xl font-bold mb-2">{selectedProject.title}</h2>
                            <p className="text-slate-400 mb-4">{selectedProject.category}</p>

                            {/* Navigation entre projets */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => setSelectedProject(project)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${selectedProject.id === project.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {project.title}
                                    </button>
                                ))}
                            </div>
                        </div>


                    </div>

                    {/* Colonne droite */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        {/* Technologies */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                            <div className="grid grid-cols-2 gap-3">
                                {selectedProject.technologies.map((tech, index) => (
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

                        {/* Fonctionnalités Techniques */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                            <div className="space-y-3">
                                {selectedProject.details?.features?.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        <p className="text-sm text-slate-300">{feature}</p>
                                    </div>
                                )) || (
                                        <p className="text-slate-400 text-sm">Fonctionnalités en cours de documentation...</p>
                                    )}
                            </div>
                        </div>

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
