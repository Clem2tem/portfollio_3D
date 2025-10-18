import React, { useState, Suspense, useRef, useEffect, useMemo } from 'react'
// SequenceAnimation was used previously for a small loading animation; loading UI replaced by IntroScreen
import IntroScreen from './IntroScreen'
import TechLogo from './TechLogo'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { projects } from '../data/projects'
import type { Project } from '../types/Project'
import * as THREE from 'three'

// Import des composants 3D
import ContactModal from './ContactModal'
import { ProgressBridge, useLoading } from '../contexts/LoadingContext'
import OptimizedScene from './OptimizedScene'

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
            id: 'default2',
            title: "Salut ! Moi c'est Clément.",
            description: 'Découvrez mes projets et mon univers créatif',
            type: 'special' as const,
            category: 'Introduction'
        }
    ]

    // Build items in the requested order: default, popclem, projects..., portal
    const default2Item = specialItems.find(s => s.id === 'default2')
    const popclemItem = specialItems.find(s => s.id === 'popclem')
    const portalItem = specialItems.find(s => s.id === 'portal')

    const items: NavigableItem[] = [
        ...(popclemItem ? [popclemItem] : []),
        ...(default2Item ? [default2Item] : []),
        ...projects,
        ...(portalItem ? [portalItem] : [])
    ]

    // Start on the 'default' entry (index 0)
    const [selectedIndex, setSelectedIndex] = useState<number>(0)
    const selectedItem = items[selectedIndex]
    const prevSelectedRef = React.useRef<string | null>(null)

    // dialogue index within the currently selected item
    const [dialogIndex, setDialogIndex] = useState<number>(0)
    const [showContact, setShowContact] = useState<boolean>(false)
    useLoading()
    // Whether the user has accepted the intro and wants to enter the portfolio
    const [enteredIntro, setEnteredIntro] = useState<boolean>(false)
    // Delay the mounting of the 3D scene for performance reasons
    const [shouldRenderScene, setShouldRenderScene] = useState<boolean>(false)

    useEffect(() => {
        const timer = setTimeout(() => setShouldRenderScene(true), 5000)
        return () => clearTimeout(timer)
    }, [])

    // helper: return dialogues for a given item
    const getDialoguesFor = (item: NavigableItem): string[] => {
        const dialoguesMap: Record<string, string[]> = {
            'popclem': [
                "Ça c'est moi...",
                "Je me présente rapidement. Je m'appelle Clément et j'ai 22 ans. J'adore développer mais je ne me résume pas à ça...",
                "J'aime aussi le sport, les jeux vidéo, la musique mais surtout...",
                "Ce que je préfère dans tout ça, c'est apprendre de nouvelles choses",
                "Vous m'incarnerez durant cette visite virtuelle pour en apprendre plus sur mes projets.",
                "Je vous laisse bientôt vous déplacer librement et explorer mon univers comme bon vous semble."
            ],
            'default2': [
                "J'ai choisi, pour mon portfolio, de modéliser en 3D les projets qui ont marqué mon parcours.",
            ],
            'hospital-project': [
                "Le premier est celui-ci, si vous le reconnaissez, c'est la FAC de pharmacie de Lille.",
                "Au cours de ma 3ème année d'école d'ingénieur, j'ai travaillé pendant 2 mois sur une application qui permet aux étudiants et aux chercheurs d'avoir un accès facile et ludique à un maximum de molécules pharmaceutiques afin d'optimiser l'apprentissage et la recherche dans le milieu de la santé.",
                "Il sert également aux professeurs de l'université car il propose des quiz sous forme de QCM notés et dont les résultats sont accessibles dans le back-office.",
                "Nous étions une équipe de 4 développeurs, et j'ai développé l'application back-office de l'application pendant que mes coéquipiers se chargeaient de faire la V3 de l'application.",
            ],
            'SAAS-ERP-EGS': [
                "Vient ensuite mon plus gros projet.",
                "Pour mon stage de fin d'études, je cherchais quelque chose qui sortait de l'ordinaire et qui me permettrait de mettre en pratique toutes les compétences que j'avais acquises durant mes années d'études.",
                "Une PME dans le secteur du BTP cherchait à développer un ERP SaaS sur-mesure pour gérer l'ensemble de ses opérations.",
                "J'ai donc saisi cette opportunité et j'ai travaillé pendant 6 mois en tant que développeur fullstack, durant lesquels j'ai du comprendre et solutionner un outil complet qui permet de gérer un chantier en commençant par la mise en contact, passant par la création d'un devis, la gestion de chantier et jusqu'à la remise des clés.",
                "Ce fut une expérience très enrichissante et un véritable défi car j'ai du m'adapter et comprendre les besoins spécifiques d'une équipe et des clients dans un milieu qui m'était totalement inconnu.",
                "Mais cette expérience m'a énormément appris, tant sur le plan technique que professionnel, et je me suis rendu encore plus compte que j'avais encore beaucoup à apprendre.",
            ],
            'portal': [
                "Maintenant, je vous laisse libre de vos mouvements.",
                "Entrez pour explorer les projets en détail et en apprendre davantage sur mes compétences."
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
            // remember previous selected id for camera event 'from'
            try { prevSelectedRef.current = items[prev].id } catch (e) { prevSelectedRef.current = null }
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
            // ignore navigation while intro screen is visible
            if (!enteredIntro) return
            setShowScrollHint(false)
            if (e.key === 'ArrowLeft') navigateTo(-1, true)
            else if (e.key === 'ArrowRight') navigateTo(1)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [items.length, enteredIntro])

    // wheel navigation: advance dialogues then items
    React.useEffect(() => {
        let last = 0
        const THROTTLE_MS = 300
        const onWheel = (e: WheelEvent) => {
            try {
                // ignore navigation while intro screen is visible
                if (!enteredIntro) return
                e.preventDefault()
                const now = performance.now()
                if (now - last < THROTTLE_MS) return
                last = now
                const dir = e.deltaY > 0 ? 1 : -1
                const dialogs = getDialoguesFor(selectedItem)
                if (dir > 0) {
                    setShowScrollHint(false)
                    if (dialogIndex < dialogs.length - 1) setDialogIndex(d => d + 1)
                    else navigateTo(1)
                } else {
                    setShowScrollHint(false)
                    if (dialogIndex > 0) setDialogIndex(d => d - 1)
                    else navigateTo(-1, true)
                }
            } catch (err) { }
        }
        window.addEventListener('wheel', onWheel, { passive: false } as AddEventListenerOptions)
        return () => window.removeEventListener('wheel', onWheel as any)
    }, [items.length, selectedIndex, dialogIndex, enteredIntro])

    // dialogIndex will be managed by navigation helpers (navigateTo)
    // Avoid resetting it unconditionally here which would override navigateTo(startAtEnd)

    const lookAtTargetRef = useRef(new THREE.Vector3(-6, 1, 7))

    // Scroll / click hint for the bottom speech bubble
    const textRef = useRef<HTMLDivElement | null>(null)
    // Only show the hint on the very first bubble (initial state)
    const [showScrollHint, setShowScrollHint] = useState<boolean>(selectedIndex === 0 && dialogIndex === 0)

    // Memoize the rendered technology nodes so they are not re-created on unrelated renders
    const techNodes = useMemo(() => {
        if (!('technologies' in selectedItem)) return null
        return (selectedItem as Project).technologies.map((tech) => (
            <div key={tech} className="flex items-center gap-3 bg-gray-700/40 p-2 rounded w-s">
                <TechLogo tech={tech} />
                <span className="text-sm text-gray-200">{tech}</span>
            </div>
        ))
    }, [selectedItem])

    // Tech logos are rendered by a memoized component in ./TechLogo.tsx

    // Camera controller
    const CameraController = () => {
        const { camera } = useThree()
        const cameraArrivedRef = useRef(false)

        // reset arrival flag when target changes so arrival will fire again
        useEffect(() => {
            cameraArrivedRef.current = false
        }, [selectedItem.id])

        useFrame(() => {
            const itemCameraPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [2, 3, 2],
                'SAAS-ERP-EGS': [0, 3, 0],
                'popclem': [0, 0.5, 1.5],
                'portal': [-1, 0.5, -2],
                'default': [45, 30, 70],
                'default2': [7, 5, 7]
            }

            const itemLookAtPositions: { [key: string]: [number, number, number] } = {
                'hospital-project': [-6, 1, 7],
                'SAAS-ERP-EGS': [8, 0, -3],
                'popclem': [-1, 0.3, 1],
                'portal': [0, 0.5, 0],
                'default2': [0, 0, 0]
            }

            const targetPosition = itemCameraPositions[selectedItem.id] || itemCameraPositions['default']
            const lookAtTarget = itemLookAtPositions[selectedItem.id] || itemLookAtPositions['default']

            // If we're on the 'default' dialogue item, scale the camera position by dialog step:
            // step 1 -> pos/1 (original), step 2 -> pos/2, step 3 -> pos/3, etc.
            let adjustedTargetPosition: [number, number, number] = targetPosition

            camera.position.lerp(new THREE.Vector3(...adjustedTargetPosition), 0.05)
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
                            const ev = new CustomEvent('cameraArrived', { detail: { id: selectedItem.id, from: prevSelectedRef.current } })
                            window.dispatchEvent(ev)
                        } catch (e) { }
                    }
                }
            } catch (e) { }
        })

        return null
    }

    // removed logo miniature and related handlers to keep file focused

    const renderMaquetteScene = () => <OptimizedScene />

    // navigation stepper: clickable items at top

    // goTo a specific index (stepper). If jumping backwards, start at end of dialogues for that item.
    const goTo = (index: number) => {
        setSelectedIndex(prev => {
            try { prevSelectedRef.current = items[prev].id } catch (e) { prevSelectedRef.current = null }
            let next = Math.max(0, Math.min(items.length - 1, index))
            if (next === prev) return prev
            const nextItem = items[next]
            const nextDialogs = getDialoguesFor(nextItem)
            // if jumping backward, start at end; otherwise start at 0
            const startAtEnd = next < prev
            setDialogIndex(startAtEnd ? Math.max(0, nextDialogs.length - 1) : 0)
            return next
        })
    }

    return (
        <div className="min-h-screen text-white">
            <div className="absolute z-[-1] inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                {shouldRenderScene && (
                    <Canvas 
                        camera={{ position: [0, 10, 15], fov: 60 }} 
                        className="w-full h-full"
                        gl={{ 
                            powerPreference: 'high-performance',
                            antialias: true,
                            alpha: false,
                            stencil: false,
                            depth: true
                        }}
                        dpr={[1, 2]}
                        shadows
                        performance={{ min: 0.5 }}
                    >
                        <ProgressBridge />
                        <Suspense fallback={null}>
                            <CameraController />
                            {renderMaquetteScene()}
                        </Suspense>
                    </Canvas>
                )}
            </div>

            {/* Keep the IntroScreen visible until the user clicks the entry button.
                Assets continue loading in background (Canvas remains mounted). */}
            {!enteredIntro && (
                <IntroScreen onEnterPortfolio={() => { setEnteredIntro(true) }} />
            )}

            <header className="absolute w-full top-3 z-50 px-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Clément DE TEMMERMAN</h1>
                        <p className="text-slate-400">Ingénieur Logiciel / Développeur Fullstack</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowContact(true)}
                            className="px-3 py-3 bg-black/50 backdrop-blur-md rounded-lg border border-white/5 text-sm text-white shadow-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Top navigation stepper (clickable) */}
            <div className="fixed top-6 left-0 right-0 z-50 pointer-events-auto">
                <div className="mx-auto w-full max-w-3xl px-6">
                    <div className="flex items-center justify-center gap-2">
                        {items.map((it, i) => {
                            const isActive = i === selectedIndex
                            const visited = i < selectedIndex
                            return (
                                <button
                                    key={it.id}
                                    onClick={(e) => { e.stopPropagation(); goTo(i) }}
                                    className={`h-2 rounded-full transition-all ${isActive ? 'bg-white w-16' : visited ? 'bg-white/60 w-8' : 'bg-slate-700 w-4'}`}
                                    aria-current={isActive}
                                    aria-label={`Aller à ${it.title || it.id}`}
                                    title={it.title || it.id}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Minimal UI: bottom speech bubble */}
            <main className="relative z-10 w-full px-6">
                <div className="min-h-[calc(100dvh-150px)]" />

                <div
                    className="fixed left-1/2 bottom-6 transform -translate-x-1/2 w-full max-w-3xl px-4"
                    onClick={() => {
                            // Do nothing if intro is still visible
                            if (!enteredIntro) return
                            // hide hint on any click and then advance the dialogue
                            setShowScrollHint(false)
                            const dialogs = getDialoguesFor(selectedItem)
                            if (dialogIndex < dialogs.length - 1) setDialogIndex(d => d + 1)
                            else navigateTo(1)
                        }}
                >
                    <div
                        className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 text-slate-100 shadow-lg relative"
                        onScroll={() => setShowScrollHint(false)}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <div className="text-sm text-slate-400">Clément</div>
                                <div ref={textRef} className="mt-2 text-lg leading-relaxed">{getDialoguesFor(selectedItem)[dialogIndex]}</div>

                                {selectedItem.id === 'portal' && dialogIndex !== 0 && (
                                    <div className="mt-4">
                                        <button onClick={onEnter3DMode} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm">Entrer dans le portail</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Subtle inline hint placed above the progress bar (no animation) */}
                        {showScrollHint && (
                            <div className="mt-3 text-xs text-white/60 text-right select-none" aria-hidden>
                                Faites défiler ou cliquez pour la suite
                            </div>
                        )}

                        {/* Progress bar: shows progress through current dialogues */}
                        <div className="mt-4">
                            <div className="h-1 bg-slate-700 rounded overflow-hidden">
                                {
                                    (() => {
                                        const dialogs = getDialoguesFor(selectedItem)
                                        const total = dialogs ? dialogs.length : 0
                                        const pct = total > 0 ? Math.round(((dialogIndex + 1) / total) * 100) : 0
                                        return (
                                            <div className="h-1 bg-white rounded transition-all" style={{ width: `${pct}%` }} aria-label={`Progression ${pct}%`} />
                                        )
                                    })()
                                }
                            </div>
                        </div>
                        {/* hint moved above progress bar */}
                    </div>
                </div>
            </main>

            {/* Technologies card for projects - positioned on the right */}
            {('technologies' in selectedItem) && (
                <div className="absolute left-6 top-1/2 transform -translate-y-3/4 z-40 min-w-[200px] max-w-xs">
                    <div className="mt-3 p-3 bg-black/50 backdrop-blur-md rounded-lg border border-white/5 text-white space-y-3 shadow-lg w-s">
                        <h3 className="font-semibold text-white mb-3">Technologies</h3>
                        {techNodes}
                    </div>
                </div>
            )}
            {showContact && <ContactModal onClose={() => setShowContact(false)} />}
        </div>
    )
}

export default HomePage
