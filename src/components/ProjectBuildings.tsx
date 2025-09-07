import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@react-three/drei'
import * as THREE from 'three'
import ExcavatorGLTF from './ExcavatorGLTF'
import ProjectZone from './ProjectZone'
import HospitalGLTF from './HospitalGLTF'
import { projects } from '../data/projects'
import { Project } from '../types/Project'
import { useProjectView } from '../contexts/ProjectViewContext'
import House from './House'

interface ProjectBuildingsProps {
    isNightMode?: boolean
}

// Renders buildings and auto-selects the project nearest to the player's XZ position.
const ProjectBuildings: React.FC<ProjectBuildingsProps> = () => {
    const buildingsRef = useRef<THREE.Group | null>(null)

    const { viewProjectById } = useProjectView()
    // which project id the player is currently inside (or null)
    const [inZone, setInZone] = useState<string | null>(null)
    const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)



    useEffect(() => {
        if (hoveredProjectId || inZone) {
            viewProjectByIdRef.current(hoveredProjectId || inZone)
        }else {
            // clear only if not in a zone
            viewProjectByIdRef.current(null)
        }
    }, [hoveredProjectId, inZone])


    // Crée un composant BuildingComponent stable (identity memoisée) pour éviter
    // qu'il soit recréé à chaque re-render parent non lié.
    const viewProjectByIdRef = useRef(viewProjectById)
    useEffect(() => {
        viewProjectByIdRef.current = viewProjectById
    }, [viewProjectById])

    const BuildingComponent = React.useMemo(
        () =>
            React.memo(({ project }: { project: Project }) => {
                const groupRef = useRef<THREE.Group | null>(null)

                const handleClickLocal = (e?: any) => {
                    e?.stopPropagation()
                    viewProjectByIdRef.current(project.id)
                }

                // Ensure the group's local position corresponds to the desired world position
                useEffect(() => {
                    if (!groupRef.current) return
                    try {
                        const worldPos = new THREE.Vector3(
                            project.position[0],
                            project.position[1],
                            project.position[2]
                        )
                        if (groupRef.current.parent) {
                            const inv = new THREE.Matrix4().copy(groupRef.current.parent.matrixWorld).invert()
                            const local = worldPos.clone().applyMatrix4(inv)
                            groupRef.current.position.copy(local)
                        } else {
                            groupRef.current.position.copy(worldPos)
                        }
                    } catch (e) {
                        // ignore
                    }
                }, [project.position])

                return (
                    <group
                        ref={groupRef}
                        // initial local position is zero; useEffect will set world-corrected local pos
                        position={[0, 0, 0]}
                        onClick={handleClickLocal}
                        onPointerOver={() => setHoveredProjectId(project.id)}
                        onPointerOut={() => setHoveredProjectId(null)}
                    >
                        {project.buildingType === 'hospital' ? (
                            // children are placed relative to the group's local origin
                            <HospitalGLTF position={[0, 0, 0]} />
                        ) : project.buildingType === 'factory' ? (
                            <>
                                <ExcavatorGLTF position={[0, 0, 0]} />
                                <House position={[0, 0, 0]} />
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


    // showZones can be toggled for debugging; default off
    const [showZones] = useState(false)

    // Debug logs removed

    return (
        <>
            <group ref={buildingsRef}>
                {projects.map((project) => (
                    <React.Fragment key={project.id}>
                        <BuildingComponent project={project} />
                        <ProjectZone project={project} radius={project.radius ? project.radius : 3} visible={showZones} setInZone={(id) => setInZone(id)} currentInZone={inZone} />
                    </React.Fragment>
                ))}
            </group>
        </>
    )
}

export default ProjectBuildings
