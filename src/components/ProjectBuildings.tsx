import React, { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Box } from '@react-three/drei'
import * as THREE from 'three'
import ExcavatorGLTF from './ExcavatorGLTF'
import HospitalGLTF from './HospitalGLTF'
import { projects } from '../data/projects'
import { Project } from '../types/Project'
import { useProjectView } from '../contexts/ProjectViewContext'
import { usePlayerPosition } from '../contexts/PlayerPositionContext'
import House from './House'

interface ProjectBuildingsProps {
    isNightMode?: boolean
}

// Renders buildings and auto-selects the project nearest to the player's XZ position.
const ProjectBuildings: React.FC<ProjectBuildingsProps> = ({ isNightMode = false }) => {
    const buildingsRef = useRef<THREE.Group | null>(null)

    const { viewedProject, viewProjectById } = useProjectView()
    const { position: playerPosition } = usePlayerPosition()

    // timers (DOM setTimeout returns number in browser env)
    const nearestTimer = useRef<number | null>(null)
    const lastAutoSelectAt = useRef<number>(0)
    const AUTOSELECT_COOLDOWN_MS = 800
    const AUTOSELECT_DEBOUNCE_MS = 250

    // hover state for top bubble UI (managed by pointer events on each building)
    const [hoveredProject, setHoveredProject] = useState<string | null>(null)
    const [techIndex, setTechIndex] = useState(0)
    const [lastHoveredProjectData, setLastHoveredProjectData] = useState<Project | null>(null)

    useEffect(() => {
        return () => {
            if (nearestTimer.current) {
                window.clearTimeout(nearestTimer.current)
                nearestTimer.current = null
            }
        }
    }, [])

    // Auto-select the nearest project to the player's XZ position.
    useFrame(() => {
        if (!playerPosition) return
        const px = playerPosition.x
        const pz = playerPosition.z

        let nearest: Project | null = null
        let nearestDistSq = Infinity
        for (const p of projects) {
            const dx = p.position[0] - px
            const dz = p.position[2] - pz
            const d2 = dx * dx + dz * dz
            if (d2 < nearestDistSq) {
                nearestDistSq = d2
                nearest = p
            }
        }
        if (!nearest) return

        const now = Date.now()
        if (now - lastAutoSelectAt.current < AUTOSELECT_COOLDOWN_MS) return

        // If nearest changed, (re)start debounce timer
        if (nearest.id !== viewedProject?.id) {
            if (nearestTimer.current) {
                window.clearTimeout(nearestTimer.current)
                nearestTimer.current = null
            }
            nearestTimer.current = window.setTimeout(() => {
                viewProjectById(nearest!.id)
                lastAutoSelectAt.current = Date.now()
                if (nearestTimer.current) {
                    window.clearTimeout(nearestTimer.current)
                    nearestTimer.current = null
                }
            }, AUTOSELECT_DEBOUNCE_MS) as unknown as number
        }
    })

    // simple outward-facing rotation so buildings look natural
    useFrame(() => {
        if (!buildingsRef.current) return
        buildingsRef.current.children.forEach((building) => {
            const worldPos = new THREE.Vector3()
            building.getWorldPosition(worldPos)
            const angle = Math.atan2(worldPos.x, worldPos.z)
            building.rotation.y = angle
        })
    })

    useEffect(() => {
        const found = projects.find((p) => p.id === hoveredProject)
        if (found) setLastHoveredProjectData(found)
    }, [hoveredProject])


    // Crée un composant BuildingComponent stable (identity memoisée) pour éviter
    // qu'il soit recréé à chaque re-render parent non lié.
    const viewProjectByIdRef = useRef(viewProjectById)
    useEffect(() => {
        viewProjectByIdRef.current = viewProjectById
    }, [viewProjectById])

    const BuildingComponent = React.useMemo(
        () =>
            React.memo(({ project }: { project: Project }) => {
                const handleClickLocal = (e?: any) => {
                    e?.stopPropagation()
                    viewProjectByIdRef.current(project.id)
                    // set cooldown pour que l'auto-select n'écrase pas le click manuel
                    lastAutoSelectAt.current = Date.now()
                    if (nearestTimer.current) {
                        window.clearTimeout(nearestTimer.current)
                        nearestTimer.current = null
                    }
                }

                return (
                    <group
                        position={project.position as unknown as [number, number, number]}
                        onClick={handleClickLocal}
                        onPointerOver={() => viewProjectById(project.id)}
                        onPointerOut={() => setHoveredProject(null)}
                    >
                        {project.buildingType === 'hospital' ? (
                            <HospitalGLTF position={project.position} />
                        ) : project.buildingType === 'factory' ? (
                            <>
                                <ExcavatorGLTF position={project.position} />
                                <House position={project.position} />
                            </>
                        ) : (
                            <Box args={[0.8, 1, 0.8]} position={[0, 0.5, 0]}>
                                <meshStandardMaterial color={'#374151'} emissive={'#374151'} emissiveIntensity={0} />
                            </Box>
                        )}
                    </group>
                )
            }),
        [] // component identity stable : ne se recrée pas sauf si on change explicitement ces dépendances
    )

    const hoveredProjectData = projects.find((p) => p.id === hoveredProject) || lastHoveredProjectData

    return (
        <>
            <group ref={buildingsRef}>
                {projects.map((project) => (
                    <BuildingComponent key={project.id} project={project} />
                ))}
            </group>


            <Html as="div" center occlude={false} className="cursor-none" style={{ position: 'fixed', top: '-45vh', left: '50%', transform: 'translateX(-50%)', zIndex: 100, pointerEvents: 'auto', width: 'auto', opacity: hoveredProject ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }}>
                <div className={`${isNightMode ? 'text-white' : 'text-gray-900'} max-w-xl cursor-none`}>
                    <div className={`flex inline-flex items-center gap-2 rounded-lg p-3`}>
                        <div className="flex items-center gap-2 absolute w-[140px] -left-[140px] top-1/2 -translate-y-1/2 pointer-events-auto" style={{ width: 120 }}>
                            <button className={`${isNightMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors px-1 cursor-none`} onClick={e => { e.stopPropagation(); setTechIndex((prev) => { if (!hoveredProjectData || !hoveredProjectData.technologies) return 0; return prev === 0 ? hoveredProjectData.technologies.length - 1 : prev - 1; }); }} tabIndex={-1} aria-label="Précédent">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            {hoveredProjectData && hoveredProjectData.technologies ? (<img src={`/logos/${hoveredProjectData.technologies[techIndex].replace(/\s+/g, '_')}.png`} alt={hoveredProjectData.technologies[techIndex]} className="w-8 h-8 object-contain rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />) : null}
                            <button className={`${isNightMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors px-1 cursor-none`} onClick={e => { e.stopPropagation(); setTechIndex((prev) => { if (!hoveredProjectData || !hoveredProjectData.technologies) return 0; return prev === hoveredProjectData.technologies.length - 1 ? 0 : prev + 1; }); }} tabIndex={-1} aria-label="Suivant">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                        <div>
                            <div className={`${isNightMode ? 'text-white' : 'text-gray-900'} text-lg font-oswald font-bold leading-tight mb-1 w-[250px]`}>{hoveredProjectData ? hoveredProjectData.title : ''}</div>
                            <div className={`${isNightMode ? 'text-gray-300' : 'text-gray-600'} text-sm font-oswald mb-2 w-[250px] tracking-wider`}>{hoveredProjectData ? hoveredProjectData.description : ''}</div>
                        </div>
                    </div>
                </div>
            </Html>
        </>
    )
}

export default ProjectBuildings
