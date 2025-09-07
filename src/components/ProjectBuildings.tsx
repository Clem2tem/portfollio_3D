import React, { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box } from '@react-three/drei'
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
const ProjectBuildings: React.FC<ProjectBuildingsProps> = () => {
    const buildingsRef = useRef<THREE.Group | null>(null)

    const { viewedProject, viewProjectById } = useProjectView()
    const { position: playerPosition } = usePlayerPosition()

    // timers (DOM setTimeout returns number in browser env)
    const nearestTimer = useRef<number | null>(null)
    const lastAutoSelectAt = useRef<number>(0)
    const AUTOSELECT_COOLDOWN_MS = 800
    const AUTOSELECT_DEBOUNCE_MS = 250


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
                        onPointerOut={() => {}}
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


    return (
        <>
            <group ref={buildingsRef}>
                {projects.map((project) => (
                    <BuildingComponent key={project.id} project={project} />
                ))}
            </group>
        </>
    )
}

export default ProjectBuildings
