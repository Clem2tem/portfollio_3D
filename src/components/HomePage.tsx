import React, { useState, Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { projects } from '../data/projects'
import type { Project } from '../types/Project'
import * as THREE from 'three'

// Import des composants 3D
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

    // Start on the 'default' entry (index 0)
    const [selectedIndex, setSelectedIndex] = useState<number>(0)
    const selectedItem = items[selectedIndex]

    // dialogue index within the currently selected item
    const [dialogIndex, setDialogIndex] = useState<number>(0)

    // helper: return dialogues for a given item
    const getDialoguesFor = (item: NavigableItem): string[] => {
        const dialoguesMap: Record<string, string[]> = {
            'default': [
                "Salut ! bienvenue sur mon portfolio.",
                "Je m'appelle Clément, je suis un jeune développeur fullstack qui vient de finir ses études d'ingénieur à HEI Lille.",
                "Ici je présente mes projets, mon parcours et quelques expériences marquantes."
            ],
            'popclem': [
                "Ça c'est moi...",
                "Je me présente rapidement. Je m'appelle Clément et j'ai 22 ans. Je suis passionné par le développement mais pas que.",
                "J'aime le sport, les jeux vidéo, la musique mais surtout...",
                "Apprendre de nouvelles choses",
                "Vous m'incarnerez durant cette visite virtuelle pour en apprendre plus sur mes projets.",
                "Par la suite vous pourrez vous déplacer librement et explorer mon univers comme bon vous semble."
            ],
            'hospital-project': [
                "J'ai choisi, pour mon portfolio, de modéliser en 3D les projets qui ont marqué mon parcours.",
                "Le premier est celui-ci, si vous le reconnaissez, c'est la FAC de pharmacie de Lille.",
                "Au cours de ma 3ème année d'école d'ingénieur, j'ai travaillé pendant 2 mois sur une application qui permet aux étudiants et aux chercheurs d'avoir un accès facile et ludique à un maximum de molécules pharmaceutiques afin d'optimiser l'apprentissage et la recherche dans le milieu de la santé.",
                "Nous étions une équipe de 4 développeurs, et j'ai développé l'application back-office de l'application pendant que mes coéquipiers se chargeaient de faire la V3 de l'application.",
            ],
            'SAAS-ERP-EGS': [
                "Vient ensuite mon plus gros projet.",
                "Pour mon stage de fin d'études, je cherchais quelque chose qui sortait de l'ordinaire et qui me permettrait de mettre en pratique toutes les compétences que j'avais acquises durant mes années d'études.",
                "Une PME dans le secteur du BTP cherchait à développer un ERP SaaS sur-mesure pour gérer l'ensemble de ses opérations.",
                "J'ai donc saisi cette opportunité et j'ai travaillé pendant 6 mois en tant que développeur fullstack, durant lesquels j'ai du comprendre et solutionner un outil complet qui permet de gérer un chantier en commençant par la mise en contact, passant par la création d'un devis, la gestion de chantier et jusqu'à la remise des clés.",
                "Ce fut une expérience très enrichissante et un véritable défi car j'ai du m'adapter et comprendre les besoins spécifiques d'une équipe et des clients dans un milieu qui m'était totalement inconnu.",
                "Technologies utilisées : Next.js, TypeScript, Prisma, Tailwind CSS, PostgreSQL.",
            ],
            'portal': [
                "Le portail vous transporte dans l'expérience 3D immersive.",
                "Entrez pour explorer les projets dans leur environnement." 
            ],
        }

        if (!item) return ["..."]

        // If a manual dialogues entry exists for this item's id, use it for both special items and projects.
        const manual = dialoguesMap[item.id]
        if (manual && manual.length) return manual

        // Otherwise, if it's a project, build a small fallback from its fields.
        if ('technologies' in item) {
            const proj = item as Project
            const techLine = proj.technologies && proj.technologies.length ? `Technologies: ${proj.technologies.join(', ')}` : ''
            const base: string[] = [proj.title, proj.description]
            if (techLine) base.push(techLine)
            return base
        }

        // Fallback: return a generic placeholder or the default dialogues.
        return dialoguesMap['default'] || ["..."]
    }

    // navigation helper: move to next/previous item and optionally start at its last dialogue
    const navigateTo = (delta: number, startAtEnd = false) => {
        setSelectedIndex(prev => {
            // No looping: clamp to [0, items.length - 1]
            let next = prev + delta
            if (next < 0) next = 0
            if (next > items.length - 1) next = items.length - 1

            // If no move, do nothing to keep dialogIndex as-is
            if (next === prev) return prev

            const nextItem = items[next]
            const nextDialogs = getDialoguesFor(nextItem)
            setDialogIndex(startAtEnd ? Math.max(0, nextDialogs.length - 1) : 0)
            return next
        })
    }

    // keyboard navigation
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') navigateTo(-1, true)
            else if (e.key === 'ArrowRight') navigateTo(1)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [items.length])

    // wheel navigation: advance dialogues then items
    React.useEffect(() => {
        let last = 0
        const THROTTLE_MS = 300
        const onWheel = (e: WheelEvent) => {
            try {
                e.preventDefault()
                const now = performance.now()
                if (now - last < THROTTLE_MS) return
                last = now
                const dir = e.deltaY > 0 ? 1 : -1
                const dialogs = getDialoguesFor(selectedItem)
                if (dir > 0) {
                    if (dialogIndex < dialogs.length - 1) setDialogIndex(d => d + 1)
                    else navigateTo(1)
                } else {
                    if (dialogIndex > 0) setDialogIndex(d => d - 1)
                    else navigateTo(-1, true)
                }
            } catch (err) {}
        }
        window.addEventListener('wheel', onWheel, { passive: false } as AddEventListenerOptions)
        return () => window.removeEventListener('wheel', onWheel as any)
    }, [items.length, selectedIndex, dialogIndex])

    // dialogIndex will be managed by navigation helpers (navigateTo)
    // Avoid resetting it unconditionally here which would override navigateTo(startAtEnd)

    const lookAtTargetRef = useRef(new THREE.Vector3(-6, 1, 7))

    // Camera controller
    const CameraController = () => {
        const { camera } = useThree()
        const cameraArrivedRef = useRef(false)

        useFrame(() => {
            const itemCameraPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [2, 3, 2],
                'SAAS-ERP-EGS': [0, 3, 0],
                'popclem': [0, 0.5, 1.5],
                'portal': [-1, 0.5, -2],
                'default': [15, 10, 15]
            }

            const itemLookAtPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [-6, 1, 7],
                'SAAS-ERP-EGS': [8, 0, -3],
                'popclem': [-1, 0.3, 1],
                'portal': [0, 0.5, 0],
                'default': [0, 0, 0]
            }

            const targetPosition = itemCameraPositions[selectedItem.id] || itemCameraPositions['default']
            const lookAtTarget = itemLookAtPositions[selectedItem.id] || itemLookAtPositions['default']

            camera.position.lerp(new THREE.Vector3(...targetPosition), 0.05)
            lookAtTargetRef.current.lerp(new THREE.Vector3(...lookAtTarget), 0.05)
            camera.lookAt(lookAtTargetRef.current)

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
                }
            } catch (e) {}
        })

        return null
    }

    // removed logo miniature and related handlers to keep file focused

    const renderMaquetteScene = () => (
        <>
            <Lighting />
            <Island />
            <Desk />
            <POPClemStatic />
            <ProjectBuildings />
            <Environment files="/hdri/office.hdr" environmentIntensity={0.1} background backgroundIntensity={0.8} blur={0.05} />
            <Portal />
        </>
    )

    return (
        <div className="min-h-screen text-white">
            <div className="absolute z-[-1] inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <Canvas camera={{ position: [0, 10, 15], fov: 60 }} className="w-full h-full">
                    <Suspense fallback={null}>
                        <CameraController />
                        {renderMaquetteScene()}
                    </Suspense>
                </Canvas>
            </div>

            <header className="relative z-50 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Clément DT</h1>
                        <p className="text-slate-400">Développeur Fullstack</p>
                    </div>
                </div>
            </header>

            {/* Minimal UI: bottom speech bubble */}
            <main className="relative z-10 w-full px-6">
                <div className="min-h-[calc(100dvh-150px)]" />

                <div
                    className="fixed left-1/2 bottom-6 transform -translate-x-1/2 w-full max-w-3xl px-4"
                    onClick={() => {
                        const dialogs = getDialoguesFor(selectedItem)
                        if (dialogIndex < dialogs.length - 1) setDialogIndex(d => d + 1)
                        else navigateTo(1)
                    }}
                >
                    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 text-slate-100 shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <div className="text-sm text-slate-400">{selectedItem.title}</div>
                                <div className="mt-2 text-lg leading-relaxed">{getDialoguesFor(selectedItem)[dialogIndex]}</div>

                                {selectedItem.id === 'portal' && (
                                    <div className="mt-4">
                                        <button onClick={onEnter3DMode} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm">Entrer dans le portail</button>
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-slate-400 self-start">{dialogIndex + 1} / {getDialoguesFor(selectedItem).length}</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default HomePage
