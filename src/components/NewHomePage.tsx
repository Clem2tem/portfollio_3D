'use client';

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

import AnimatedBackground from './AnimatedBackground';
import ContactModal from './ContactModal';
import Preloader from './Preloader';
import SectionNavigation from './SectionNavigation';

import POPClemStatic from './POPClemStatic';
import HospitalGLTF from './HospitalGLTF';
import House from './House';
import ExcavatorGLTF from './ExcavatorGLTF';
import Portal from './Portal';

import useSmoothScroll from '../hooks/useSmoothScroll';
import useSplitText from '../hooks/useSplitText';
import ToyBox from './ToyBox';
import { Environment } from '@react-three/drei';

gsap.registerPlugin(ScrollTrigger);


interface HomePageProps {
    onEnter3DMode: () => void;
}

type Vec3 = [number, number, number];

type ModelStopId = 'popclem' | 'hospital' | 'house' | 'portal';

interface ModelStop {
    id: ModelStopId;
    position: Vec3;
    lookAt: Vec3;
}

/* -------------------------------------------------------------------------- */
/*                         CAMERA STOPS (STYLE IGLOO)                         */
/* -------------------------------------------------------------------------- */

const MODEL_STOPS: ModelStop[] = [
    {
        id: 'popclem',
        position: [1.5, 1.8, 0],
        lookAt: [0, 1.8, 0],
    },
    {
        id: 'hospital',
        position: [2, 0.4, 0],
        lookAt: [0, 0.4, 0],
    },
    {
        id: 'house',
        position: [3, -1.2, 0],
        lookAt: [0, -1.2, 0],
    },
    {
        id: 'portal',
        position: [1.3, -2.4, 0],
        lookAt: [0, -2.4, 0],
    },
];

/* map section -> index dans MODEL_STOPS */
const SECTION_TO_STOP_INDEX: Record<string, number | null> = {
    popclem: 0,
    hospital: 1,
    house: 2,
    portal: 3,
    cta: null,
};

/* -------------------------------------------------------------------------- */
/*                                 CAMERA RIG                                 */
/* -------------------------------------------------------------------------- */

interface CameraRigProps {
    activeStopIndex: number;
    mouseRef: React.MutableRefObject<{ x: number; y: number }>;
    onCameraPositionChange?: (position: Vec3) => void;
}

const CameraRig: React.FC<CameraRigProps> = ({ activeStopIndex, mouseRef, onCameraPositionChange }) => {
    const { camera } = useThree();
    const lookAtRef = useRef(new THREE.Vector3(0, 1.2, 0));
    const hasInitialised = useRef(false);

    // 1. position initiale
    useEffect(() => {
        if (hasInitialised.current) return;
        const first = MODEL_STOPS[0];
        camera.position.set(...first.position);
        lookAtRef.current.set(...first.lookAt);
        camera.lookAt(lookAtRef.current);
        hasInitialised.current = true;
    }, [camera]);

    // 2. tween quand la section change
    useEffect(() => {
        const stop = MODEL_STOPS[activeStopIndex];
        if (!stop) return;

        gsap.to(camera.position, {
            x: stop.position[0],
            y: stop.position[1],
            z: stop.position[2],
            duration: 0.8,
            ease: 'power3.inOut',
        });

        gsap.to(lookAtRef.current, {
            x: stop.lookAt[0],
            y: stop.lookAt[1],
            z: stop.lookAt[2],
            duration: 0.8,
            ease: 'power3.inOut',
        });
    }, [activeStopIndex, camera]);

    // 3. parallax + légère rotation subtile (Option A)
    useFrame(() => {
        const mouse = mouseRef.current;
        const parallaxStrength = 0.10;

        // Calcule l'offset parallax
        const offsetX = mouse.x * parallaxStrength;
        const offsetY = -mouse.y * parallaxStrength;

        let targetPos = new THREE.Vector3();

        // Position cible du stop actif
        const stop = MODEL_STOPS[activeStopIndex];

        const stopOffsets = {
            popclem: 1.5,
            hospital: 2.5,
            house: 3,
            portal: 0,
        }
        if (!stop) return;
        if (mouse.x < -0.5) {
            targetPos = new THREE.Vector3(
                stop.position[0] * (1 - Math.abs(mouse.x)),
                stop.position[1] - offsetY,
                stopOffsets[stop.id]
            );
        } else if (mouse.x > 0.5) {
            targetPos = new THREE.Vector3(
                stop.position[0] * (1 - Math.abs(mouse.x)),
                stop.position[1],
                -stopOffsets[stop.id]
            );
        } else {
            // Nouvelle position avec parallax
            targetPos = new THREE.Vector3(
                stop.position[0],
                stop.position[1] + offsetY,
                stop.position[2] + offsetX,
            );
        }
        // Interpolation douce vers la nouvelle position
        camera.position.lerp(targetPos, 0.08);
        
        // Update camera position callback
        if (onCameraPositionChange) {
            onCameraPositionChange([camera.position.x, camera.position.y, camera.position.z]);
        }
        
        // LookAt inchangé
        camera.lookAt(lookAtRef.current);
        // const targetRoll = mouse.x * 0.04;
        // camera.rotation.z = THREE.MathUtils.lerp(
        //     camera.rotation.z,
        //     targetRoll,
        //     0.08,
        // );

    });

    return null;
};

/* -------------------------------------------------------------------------- */
/*                                ISLAND SCENE                                */
/* -------------------------------------------------------------------------- */

interface IslandSceneProps {
    setHoveredId: (id: ModelStopId | null) => void;
    cameraPosition?: Vec3;
}

const IslandScene: React.FC<IslandSceneProps> = ({ setHoveredId, cameraPosition }) => {
    // Calculer les positions des lumières relatives à la caméra
    const light1Position: Vec3 = cameraPosition 
        ? [cameraPosition[0], cameraPosition[1] + 2, cameraPosition[2]]
        : [5, 1.5, 6];
    
    const light2Position: Vec3 = cameraPosition
        ? [0, cameraPosition[1] + 2, cameraPosition[2]]
        : [0, 1.5, -3];

    return (
        <>
            {/* éclairage global qui suit la caméra */}
            <directionalLight position={light1Position} intensity={0.04} />
            <directionalLight position={light2Position} intensity={0.5} />
            <Environment
                preset="sunset"
                environmentIntensity={0.5}
                backgroundIntensity={0} // pas de lumière
                blur={0.5}
            />
            {/* POPClem ------------------------------------------------------------ */}
            <group position={[0, 1.5, 0]} rotation={[0, 1.1 * Math.PI / 8, 0]}>
                <POPClemStatic />
                <ToyBox
                    position={[0, 0.29, 0]}
                    rotation={[0, (1.1 * Math.PI / 3), 0]}
                    size={[0.5, 0.6, 0.5]} // W / H / D
                    thickness={0.01}
                    color="#1a2d58"
                    headerHeight={0.12}
                    headerText="Clément"
                    headerTextSize={0.11}
                    headerTextColor="#fff"
                />
            </group>

            {/* Hôpital ------------------------------------------------------------ */}
            <group
                position={[0, 0, 0.27]}
                rotation={[0, -(0.96 * Math.PI) / 6, 0]}
            >
                <HospitalGLTF position={[0, 0, 0]} scale={0.1} logoHide />
                <ToyBox
                    position={[-0.23, 0.4, -0.2]}
                    rotation={[0, (4 * Math.PI / 6), 0]}
                    size={[1.5, 0.8, 1.5]} // W / H / D
                    thickness={0.01}
                    color="#1a2d58"
                    headerHeight={0.2}
                    headerText="MEDCHEM STRUCTURE GENIUS"
                    headerTextSize={0.12}
                    headerTextColor="#fff"
                    technologies={['React', 'Node.js', 'Next.js', 'Supabase', 'Vercel', 'TypeScript']}
                />
            </group>

            {/* Maison + pelleteuse ----------------------------------------------- */}
            <group position={[0, -1.5, 0]} rotation={[0, - 0.91 * Math.PI / 7, 0]}>
                <House position={[0.35, -0.03, 0]} scale={0.1} />
                <ExcavatorGLTF position={[1, -0.04, 0]} scale={0.1} logoHide />
                <ToyBox
                    position={[0, 0.30, 0]}
                    rotation={[0, (1.9 * Math.PI / 3), 0]}
                    size={[2.2, 0.7, 2]} // W / H / D
                    thickness={0.01}
                    color="#1a2d58"
                    headerHeight={0.2}
                    headerText="SAAS ERP - EGS"
                    headerTextSize={0.12}
                    headerTextColor="#fff"
                    technologies={['React', 'TypeScript', 'Next.js', 'Node.js', 'Firebase', 'Git', 'Google Cloud']}
                />
            </group>

            {/* Portail ------------------------------------------------------------ */}
            <group position={[0, -2.7, 0]} scale={0.6} rotation={[0, 1.05 * Math.PI / 3, 0]}>
                <Portal />
                <mesh
                    position={[-2.5, 1.5, 0]}
                    onPointerOver={() => setHoveredId('portal')}
                    onPointerOut={() => setHoveredId(null)}
                >
                    <planeGeometry args={[3.5, 3]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            </group>
        </>
    );
};

/* -------------------------------------------------------------------------- */
/*                              HUD SIDE OVERLAY                              */
/* -------------------------------------------------------------------------- */

const hudConfig: Record<
    ModelStopId,
    { label: string; title: string; extra: string[] }
> = {
    popclem: {
        label: 'PORTFOLIO_CO_01',
        title: 'POPClem Avatar',
        extra: ['TEMP     94.52', '+01.45'],
    },
    hospital: {
        label: 'PORTFOLIO_CO_02',
        title: 'Hospital Complex',
        extra: ['TEMP     91.12', '+00.75'],
    },
    house: {
        label: 'PORTFOLIO_CO_03',
        title: 'Construction Site',
        extra: ['TEMP     89.64', '-00.12'],
    },
    portal: {
        label: 'PORTFOLIO_CO_04',
        title: 'Portal Access',
        extra: ['TEMP     96.01', '+02.31'],
    },
};

const HudOverlay: React.FC<{ hoveredId: ModelStopId | null }> = ({
    hoveredId,
}) => {
    if (!hoveredId || !hudConfig[hoveredId]) return null;
    const data = hudConfig[hoveredId];

    return (
        <div className="pointer-events-none fixed inset-0 z-30">
            <div className="absolute left-14 top-1/2 -translate-y-1/2 text-white font-mono side-info-panel">
                <p className="sidetitle">{data.label}</p>
                <p className="biglabel">{data.title}</p>
                {data.extra.map((line) => (
                    <p key={line} className="side-extra">
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                               PAGE PRINCIPALE                              */
/* -------------------------------------------------------------------------- */

const NewHomePage: React.FC<HomePageProps> = ({ onEnter3DMode }) => {
    const [showContact, setShowContact] = useState(false);
    const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);
    const [lang, setLang] = useState<'fr' | 'en'>('fr');
    const [cameraPosition, setCameraPosition] = useState<Vec3>([0, 0, 0]);

    const translations = useMemo(() => ({
        fr: {
            subtitle: 'Clément',
            title: 'Ingénieur FullStack / Ingénieur Logiciel',
            contact: 'Contact',
            mode3d: 'Mode 3D',
            popclem: {
                step: 'MOI',
                title: 'Bonjour !',
                description: 'Ça c\'est moi ! A travers ce portfolio intéractif, découvre mon parcours et mes compétences.'
            },
            hospital: {
                step: 'MEDCHEM STRUCTURE GENIUS',
                title: 'Zoom out vers l\'hôpital.',
                description: 'On passe à l\'échelle : la caméra recule, se décale, et le HUD affiche le contexte du bâtiment comme un artefact d\'archives glacées.'
            },
            house: {
                step: 'SAAS ERP - EGS',
                title: 'Maison & pelleteuse, en diptyque.',
                description: 'Architecture et mécanique réunies dans une même scène. La caméra glisse latéralement, le HUD réagit au survol du côté gauche de la composition.'
            },
            portal: {
                step: 'MODE LIBRE 3D',
                title: 'Le portail vers l\'univers complet.',
                description: 'Dernier stop : le portail. Il sert de passerelle vers ton mode 3D libre, pendant que le HUD affiche l\'entrée "PORTFOLIO_CO_04".'
            },
            footer: '© 2024 Clément De Temmerman — Portfolio 3D expérimental'
        },
        en: {
            subtitle: 'Clément',
            title: 'FullStack Engineer / Software Engineer',
            contact: 'Contact',
            mode3d: '3D Mode',
            popclem: {
                step: 'ME',
                title: 'POPClem leads the way.',
                description: 'First stop of the journey: the avatar. The camera moves closer, slightly from above, while the HUD displays character info on the side.'
            },
            hospital: {
                step: 'MEDCHEM STRUCTURE GENIUS',
                title: 'Zoom out to the hospital.',
                description: 'Scaling up: the camera pulls back, shifts, and the HUD displays the building context like a frozen archive artifact.'
            },
            house: {
                step: 'SAAS ERP - EGS',
                title: 'House & excavator, in diptych.',
                description: 'Architecture and mechanics united in a single scene. The camera glides laterally, the HUD reacts on hover over the left side of the composition.'
            },
            portal: {
                step: '3D FREE MODE',
                title: 'The portal to the complete universe.',
                description: 'Final stop: the portal. It serves as a gateway to your free 3D mode, while the HUD displays the "PORTFOLIO_CO_04" entry.'
            },
            footer: '© 2024 Clément De Temmerman — Experimental 3D Portfolio'
        }
    }), []);

    const t = translations[lang];

    const { scrollTo } = useSmoothScroll();
    useSplitText('[data-split]', { stagger: 0.03, duration: 1 });

    const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const [activeSection, setActiveSection] = useState<string>('popclem');
    const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
    const [hoveredId, setHoveredId] = useState<ModelStopId | null>(null);

    const sections = useMemo(
        () => [
            { id: 'popclem', label: 'MOI' },
            { id: 'hospital', label: 'MEDCHEM STRUCTURE GENIUS' },
            { id: 'house', label: 'SAAS ERP - EGS' },
            { id: 'portal', label: 'MODE LIBRE 3D' },
        ],
        [],
    );

    const registerSection = useCallback((id: string, node: HTMLElement | null) => {
        sectionRefs.current[id] = node;
    }, []);

    const handleNavigation = useCallback(
        (id: string) => {
            const target = sectionRefs.current[id];
            if (target) {
                scrollTo(target, { offset: -120 });
            }
        },
        [scrollTo],
    );

    useEffect(() => {
        const timer = window.setTimeout(() => setIsPreloaderVisible(false), 1600);
        return () => window.clearTimeout(timer);
    }, []);

    // parallax souris global
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const x = (event.clientX / window.innerWidth - 0.5) * 2;
            const y = (event.clientY / window.innerHeight - 0.5) * 2;
            mouseRef.current = { x, y };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // ScrollTrigger : activeSection + caméra
    useEffect(() => {
        const triggers: ScrollTrigger[] = [];

        sections.forEach((section) => {
            const el = sectionRefs.current[section.id];
            if (!el) return;

            const trigger = ScrollTrigger.create({
                trigger: el,
                start: 'top 60%',
                end: 'bottom 40%',
                onEnter: () => {
                    setActiveSection(section.id);
                    const idx = SECTION_TO_STOP_INDEX[section.id];
                    if (idx !== null && idx !== undefined) {
                        setActiveStopIndex(idx);
                    }
                },
                onEnterBack: () => {
                    setActiveSection(section.id);
                    const idx = SECTION_TO_STOP_INDEX[section.id];
                    if (idx !== null && idx !== undefined) {
                        setActiveStopIndex(idx);
                    }
                },
            });

            triggers.push(trigger);
        });

        // Snap “écran par écran”
        const snapTrigger = ScrollTrigger.create({
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            snap: {
                snapTo: (value) => {
                    const step = 1 / (sections.length - 1);
                    return Math.round(value / step) * step;
                },
                duration: 0.5,
                ease: 'power3.out',
            },
        });

        const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 100);

        return () => {
            window.clearTimeout(refreshId);
            triggers.forEach((t) => t.kill());
            snapTrigger.kill();
        };
    }, [sections]);

    return (
        <div className="relative min-h-screen text-white overflow-x-hidden">
            {/* Canvas plein écran derrière l’UI */}
            <div className="fixed inset-0 z-0">
                <Canvas
                    camera={{ position: [0, 2, 10], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                >
                    <Suspense fallback={null}>
                        <CameraRig 
                            activeStopIndex={activeStopIndex} 
                            mouseRef={mouseRef} 
                            onCameraPositionChange={setCameraPosition}
                        />
                        <IslandScene 
                            setHoveredId={setHoveredId} 
                            cameraPosition={cameraPosition}
                        />
                    </Suspense>
                </Canvas>
            </div>

            {/* Effets de fond + HUD */}
            <AnimatedBackground />
            <HudOverlay hoveredId={hoveredId} />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 px-6 md:px-12 py-6 flex items-center justify-between ">
                <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                    <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/60">
                            {t.subtitle}
                        </p>
                        <p className="font-semibold text-lg">{t.title}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                        className="px-4 py-2 rounded-full border border-white/20 text-sm font-semibold hover:border-white/60 transition-colors"
                    >
                        {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
                    </button>
                    <button
                        type="button"
                        onClick={onEnter3DMode}
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-semibold tracking-[0.2em]"
                    >
                        {t.mode3d}
                    </button>
                </div>
            </header>

            {/* Stepper latéral */}
            <SectionNavigation
                sections={sections}
                activeId={activeSection}
                onSelect={handleNavigation}
            />

            {/* Contenu texte (sections 100vh) */}
            <main className="relative z-10 pt-32 pb-32 space-y-32">

                {/* POPCLEM */}
                <section
                    id="popclem"
                    ref={(node) => registerSection('popclem', node as HTMLElement)}
                    className="h-screen flex items-center px-6 md:px-12"
                >
                    <div className="max-w-4xl space-y-8">
                        <p
                            className="text-xs uppercase tracking-[0.5em] text-white/60"
                            data-animate="fade-up"
                        >
                            {t.popclem.step}
                        </p>
                        <h1
                            data-split
                            className="text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05]"
                        >
                            {t.popclem.title}
                        </h1>
                        <p
                            className="text-lg md:text-xl text-white/80 max-w-2xl"
                            data-animate="fade-up"
                        >
                            {t.popclem.description}
                        </p>
                    </div>

                </section>

                {/* HÔPITAL */}
                <section
                    id="hospital"
                    ref={(node) => registerSection('hospital', node as HTMLElement)}
                    className="h-screen flex items-center px-6 md:px-12"
                >

                </section>

                {/* MAISON + PELLETEUSE */}
                <section
                    id="house"
                    ref={(node) => registerSection('house', node as HTMLElement)}
                    className="h-screen flex items-center px-6 md:px-12"
                >

                </section>

                {/* PORTAIL */}
                <section
                    id="portal"
                    ref={(node) => registerSection('portal', node as HTMLElement)}
                    className="h-screen flex items-end px-6 md:px-12"
                >
                    <div className="mx-auto">
                        <button
                            type="button"
                            onClick={onEnter3DMode}
                            className="px-10 py-4 rounded-full bg-white text-black font-semibold uppercase tracking-[0.4em] "
                        >
                            {t.portal.step}
                        </button>
                    </div>
                </section>
            </main>

            <footer className="relative z-10 px-6 md:px-12 pb-10 text-white/50 text-sm uppercase tracking-[0.4em]">
                {t.footer}
            </footer>

            <Preloader isVisible={isPreloaderVisible} />
            {showContact && <ContactModal onClose={() => setShowContact(false)} />}
        </div>
    );
};

export default NewHomePage;
