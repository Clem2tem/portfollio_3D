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
import { Environment } from '@react-three/drei';
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
// ⚠️ À adapter au nom de ton composant / modèle Porsche réel
// import PorscheGLTF from './PorscheGLTF';

import useSmoothScroll from '../hooks/useSmoothScroll';
import useSplitText from '../hooks/useSplitText';

gsap.registerPlugin(ScrollTrigger);

interface HomePageProps {
    onEnter3DMode: () => void;
}

type Vec3 = [number, number, number];

type ModelStopId = 'hero' | 'popclem' | 'hospital' | 'house' | 'porsche' | 'portal';

interface ModelStop {
    id: ModelStopId;
    position: Vec3;
    lookAt: Vec3;
}

// 📍 Poses caméra pour chaque modèle (tu pourras ajuster ces valeurs)
const MODEL_STOPS: ModelStop[] = [
    {
        id: 'hero',
        position: [1, 4, 1],
        lookAt: [0, 4, 0],
    },
    {
        id: 'popclem',
        position: [0.3, 1.6, 2],
        lookAt: [0, 1.6, 0],
    },
    {
        id: 'hospital',
        position: [5, 0.9, -7],
        lookAt: [0, 0.9, 0],
    },
    {
        id: 'house',
        position: [3.2*1.2, -6, 8.2*1.2],
        lookAt: [0, -6, 0],
    },
    {
        id: 'porsche',
        position: [1.6, -9, 4.5],
        lookAt: [0, -9, 0],
    },
    {
        id: 'portal',
        position: [0, -12, 10],
        lookAt: [0, -12, 0],
    },
];

const MODEL_IDS: ModelStopId[] = [
    'hero',
    'popclem',
    'hospital',
    'house',
    'porsche',
    'portal'
];

const SECTION_HOLD_PROGRESS = 0.45;


/* -------------------------------- CAMERA RIG -------------------------------- */

interface CameraRigProps {
    scrollPathRef: React.MutableRefObject<number>;
    mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}

const CameraRig: React.FC<CameraRigProps> = ({ scrollPathRef, mouseRef }) => {
    const { camera } = useThree();
    const target = useRef(new THREE.Vector3(0, 1, 0));

    useEffect(() => {
        const firstStop = MODEL_STOPS[0];
        camera.position.set(...firstStop.position);
        target.current.set(...firstStop.lookAt);
        camera.lookAt(target.current);
    }, [camera]);

    useFrame(() => {
        const t = THREE.MathUtils.clamp(scrollPathRef.current, 0, MODEL_STOPS.length - 1);
        const i0 = Math.floor(t);
        const i1 = Math.min(MODEL_STOPS.length - 1, i0 + 1);
        const f = t - i0;

        const s0 = MODEL_STOPS[i0];
        const s1 = MODEL_STOPS[i1];

        // positions interpolées
        const posX = THREE.MathUtils.lerp(s0.position[0], s1.position[0], f);
        const posY = THREE.MathUtils.lerp(s0.position[1], s1.position[1], f);
        const posZ = THREE.MathUtils.lerp(s0.position[2], s1.position[2], f);

        // lookAt interpolé
        const lookX = THREE.MathUtils.lerp(s0.lookAt[0], s1.lookAt[0], f);
        const lookY = THREE.MathUtils.lerp(s0.lookAt[1], s1.lookAt[1], f);
        const lookZ = THREE.MathUtils.lerp(s0.lookAt[2], s1.lookAt[2], f);

        // effet souris subtile
        const mouse = mouseRef.current;
        const mx = mouse.x * 0.5;
        const my = mouse.y * 0.3;

        const targetPos = {
            x: posX + mx,
            y: posY - my,
            z: posZ,
        };

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetPos.x, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetPos.y, 0.08);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetPos.z, 0.08);

        target.current.set(lookX, lookY, lookZ);
        camera.lookAt(target.current);
    });


    return null;
};

/* --------------------------- MODEL SWITCHER (SCÈNE) -------------------------- */

const IslandScene = () => {
    const popRef = useRef<THREE.Group>(null);
    const hospitalRef = useRef<THREE.Group>(null);
    const houseRef = useRef<THREE.Group>(null);
    const porscheRef = useRef<THREE.Group>(null);
    const portalRef = useRef<THREE.Group>(null);

    const groups = useMemo(
        () => [popRef, hospitalRef, houseRef, porscheRef, portalRef],
        []
    );

    useFrame(() => {
        groups.forEach((ref) => {
            if (!ref.current) return;
            ref.current.visible = true;
            const current = ref.current.scale.x;
            const next = THREE.MathUtils.lerp(current, 1, 0.1);
            ref.current.scale.setScalar(next);
        });
    });

    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />
            <Environment preset="sunset" />

            <group ref={popRef} position={[1, 1.15, -1]}>
                <POPClemStatic />
            </group>

            <group ref={hospitalRef} position={[1.5, -2.1, 0]} >
                <HospitalGLTF position={[0, 0, 0]} scale={0.2} logoHide={true} />
            </group>

            <group ref={houseRef} position={[0, -8, 0]} rotation={[0, Math.PI / 2, 0]}>
                <House position={[-2, 0, 0]} />
                <ExcavatorGLTF position={[2, 0, 0]} />
            </group>

            <group ref={porscheRef} position={[0, -12, 0]}>
                {/* <PorscheGLTF /> */}
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#e11d48" />
                </mesh>
            </group>

            <group ref={portalRef} position={[0, -12, 0]}>
                <Portal />
            </group>
        </>
    );
};

/* ---------------------------- PAGE PRINCIPALE ---------------------------- */

const NewHomePage: React.FC<HomePageProps> = ({ onEnter3DMode }) => {
    const [showContact, setShowContact] = useState(false);
    const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);

    const { scrollTo } = useSmoothScroll();
    useSplitText('[data-split]', { stagger: 0.03, duration: 1 });

    const scrollPathRef = useRef(0); // t global 0 → 4
    const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const [activeSection, setActiveSection] = useState<string>('hero');
    const snapPointsRef = useRef<number[]>([]);

    const registerSection = useCallback((id: string, node: HTMLElement | null) => {
        sectionRefs.current[id] = node;
    }, []);

    // Sections pour le stepper (nav à droite)
    const sections = useMemo(
        () => [
            { id: 'hero', label: 'Accueil' },
            { id: 'popclem', label: 'Avatar' },
            { id: 'hospital', label: 'Hôpital' },
            { id: 'house', label: 'Maison' },
            { id: 'porsche', label: 'Porsche' },
            { id: 'portal', label: 'Portail' },
            { id: 'cta', label: 'Contact' },
        ],
        []
    );

    const handleNavigation = useCallback(
        (id: string) => {
            const target = sectionRefs.current[id];
            if (target) {
                scrollTo(target, { offset: -120 });
            }
        },
        [scrollTo]
    );

    // Preloader simple (temps fixe, tu peux le connecter aux loaders GLTF si tu veux)
    useEffect(() => {
        const timer = window.setTimeout(() => setIsPreloaderVisible(false), 1800);
        return () => window.clearTimeout(timer);
    }, []);

    // Mouvement souris → parallax caméra
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const x = (event.clientX / window.innerWidth - 0.5) * 2;
            const y = (event.clientY / window.innerHeight - 0.5) * 2;
            mouseRef.current = { x, y };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // ScrollTrigger pour :
    // - set activeSection (UI)
    // - mapper le scroll sur la timeline 3D globale (scrollPathRef)
    useEffect(() => {
        const triggers: ScrollTrigger[] = [];

        // 1) Gestion de l'activeSection pour toutes les sections texte
        sections.forEach((section) => {
            const el = sectionRefs.current[section.id];
            if (!el) return;

            const trigger = ScrollTrigger.create({
                trigger: el,
                start: 'top 60%',
                end: 'bottom 40%',
                onEnter: () => setActiveSection(section.id),
                onEnterBack: () => setActiveSection(section.id),
            });

            triggers.push(trigger);
        });

        // 2) Mapping spécifique pour les 5 sections modèles → valeur t continue
        MODEL_IDS.forEach((id, index) => {
            const el = sectionRefs.current[id];
            if (!el) return;

            const trigger = ScrollTrigger.create({
                trigger: el,
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
                onUpdate: (self) => {
                    const tRaw = index + self.progress;
                    scrollPathRef.current = THREE.MathUtils.clamp(
                        tRaw,
                        0,
                        MODEL_STOPS.length - 1
                    );
                },
            });


            triggers.push(trigger);
        });

        const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 100);

        return () => {
            window.clearTimeout(refreshId);
            triggers.forEach((t) => t.kill());
        };
    }, [sections]);

    useEffect(() => {
        const computeSnapPoints = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll <= 0) {
                snapPointsRef.current = [];
                return;
            }

            const points = sections
                .map((section) => {
                    const el = sectionRefs.current[section.id];
                    if (!el) return top
                    return THREE.MathUtils.clamp(el.offsetTop / maxScroll, 0, 1);
                })
                .filter((value): value is number => value !== null);

            snapPointsRef.current = points;
        };

        const snapTrigger = ScrollTrigger.create({
            trigger: document.body,
            start: 'top top',
            end: 'bottom top',
            snap: {
                snapTo: (progress) => {
                    if (!snapPointsRef.current.length) return progress;
                    let closest = snapPointsRef.current[0];
                    let smallestDiff = Math.abs(progress - closest);

                    snapPointsRef.current.forEach((point) => {
                        const diff = Math.abs(progress - point);
                        if (diff < smallestDiff) {
                            smallestDiff = diff;
                            closest = point;
                        }
                    });

                    const snappedIndex = snapPointsRef.current.indexOf(closest);
                    const sectionMeta = sections[snappedIndex];
                    const sectionLabel = sectionMeta?.label ?? 'unknown';
                    const modelStopId: ModelStopId | 'none' = MODEL_IDS.includes(
                        sectionMeta?.id as ModelStopId
                    )
                        ? (sectionMeta?.id as ModelStopId)
                        : 'none';
                    const snappedPixels = Math.round(
                        closest * (document.documentElement.scrollHeight - window.innerHeight)
                    );
                    const cameraStop = MODEL_STOPS[snappedIndex];
                    console.log('[ScrollSnap]', {
                        from: progress.toFixed(3),
                        to: closest.toFixed(3),
                        section: sectionLabel,
                        modelStopId,
                        pixelOffset: snappedPixels,
                        cameraPosition: cameraStop ? cameraStop.position : null,
                        cameraTarget: cameraStop ? cameraStop.lookAt : null,
                    });

                    return closest;
                },
                duration: 0.6,
                ease: 'power3.out',
            },
        });

        computeSnapPoints();

        const handleResize = () => {
            computeSnapPoints();
        };

        window.addEventListener('resize', handleResize);
        ScrollTrigger.addEventListener('refresh', computeSnapPoints);

        return () => {
            window.removeEventListener('resize', handleResize);
            ScrollTrigger.removeEventListener('refresh', computeSnapPoints);
            snapTrigger.kill();
        };
    }, [sections]);

    return (
        <div className="relative min-h-screen text-white overflow-x-hidden">
            {/* Canvas global plein écran (sous l'UI mais visible) */}
            <div className="fixed inset-0 z-0">
                <Canvas
                    camera={{ position: [0, 2, 10], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                >
                    <Suspense fallback={null}>
                        <CameraRig scrollPathRef={scrollPathRef} mouseRef={mouseRef} />
                        <IslandScene />
                    </Suspense>
                </Canvas>
            </div>

            {/* Background FX */}
            <AnimatedBackground />
            <div className="absolute inset-0 pointer-events-none bg-transparent" />


            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 px-6 md:px-12 py-6 flex items-center justify-between backdrop-blur-2xl bg-black/30 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                    <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/60">
                            Clément
                        </p>
                        <p className="font-semibold text-lg">Studio 3D</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.4em] text-white/60">
                    <button
                        type="button"
                        onClick={() => handleNavigation('popclem')}
                        className="hover:text-white transition-colors"
                    >
                        Avatar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleNavigation('hospital')}
                        className="hover:text-white transition-colors"
                    >
                        Hôpital
                    </button>
                    <button
                        type="button"
                        onClick={() => handleNavigation('porsche')}
                        className="hover:text-white transition-colors"
                    >
                        Porsche
                    </button>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowContact(true)}
                        className="px-5 py-2 rounded-full border border-white/20 text-sm uppercase tracking-[0.3em] hover:border-white/60"
                    >
                        Contact
                    </button>
                    <button
                        type="button"
                        onClick={onEnter3DMode}
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-semibold tracking-[0.2em]"
                    >
                        Mode 3D
                    </button>
                </div>
            </header>

            {/* Stepper latéral */}
            <SectionNavigation
                sections={sections}
                activeId={activeSection}
                onSelect={handleNavigation}
            />

            {/* Contenu texte overlay */}
            <main className="relative z-10 pt-32 pb-32 space-y-32">
                {/* HERO */}
                <section
                    id="hero"
                    ref={(node) => registerSection('hero', node as HTMLElement)}
                    className="min-h-screen flex items-center px-6 md:px-12"
                >
                    <div className="max-w-4xl space-y-8">
                        <p
                            className="text-xs uppercase tracking-[0.5em] text-white/60"
                            data-animate="fade-up"
                        >
                            Creative Developer • R3F
                        </p>
                        <h1
                            data-split
                            className="text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05]"
                        >
                            Un parcours 3D continu, de l’avatar à la Porsche.
                        </h1>
                        <p
                            className="text-lg md:text-xl text-white/80 max-w-2xl"
                            data-animate="fade-up"
                        >
                            Comme sur igloo.inc, le scroll orchestre la caméra : chaque
                            section devient un point de vue cinématique sur un nouveau modèle.
                        </p>
                    </div>
                </section>

                {/* POPCLEM */}
                <section
                    id="popclem"
                    ref={(node) => registerSection('popclem', node as HTMLElement)}
                    className="min-h-screen flex items-center px-6 md:px-12"
                >
                    <div className="max-w-3xl space-y-6">
                        <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
                            Étape 01 • Avatar
                        </p>
                        <h2
                            data-split
                            className="text-4xl md:text-6xl font-semibold"
                        >
                            POPClem ouvre la marche.
                        </h2>
                        <p className="text-white/75" data-animate="fade-up">
                            Premier stop du voyage : l’avatar. La caméra se place près du
                            personnage, légèrement en plongée, avec un parallax réactif à la
                            souris.
                        </p>
                    </div>
                </section>

                {/* HOPITAL */}
                <section
                    id="hospital"
                    ref={(node) => registerSection('hospital', node as HTMLElement)}
                    className="min-h-screen flex items-center px-6 md:px-12"
                >
                    <div className="max-w-3xl space-y-6">
                        <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
                            Étape 02 • Bâtiment
                        </p>
                        <h2
                            data-split
                            className="text-4xl md:text-6xl font-semibold"
                        >
                            Zoom out vers l’hôpital.
                        </h2>
                        <p className="text-white/75" data-animate="fade-up">
                            On passe à l’échelle : la caméra recule, monte, et montre
                            l’hôpital dans son ensemble. Le scroll contrôle la transition, pas
                            un bouton.
                        </p>
                    </div>
                </section>

                {/* MAISON + PELLETEUSE */}
                <section
                    id="house"
                    ref={(node) => registerSection('house', node as HTMLElement)}
                    className="min-h-screen flex items-center px-6 md:px-12"
                >
                    <div className="max-w-3xl space-y-6">
                        <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
                            Étape 03 • Chantier
                        </p>
                        <h2
                            data-split
                            className="text-4xl md:text-6xl font-semibold"
                        >
                            Maison & pelleteuse, en diptyque.
                        </h2>
                        <p className="text-white/75" data-animate="fade-up">
                            La scène mixe architecture et mécanique. La caméra glisse
                            latéralement pour donner une impression de travelling entre la
                            maison et l’engin.
                        </p>
                    </div>
                </section>

                {/* PORSCHE */}
                <section
                    id="porsche"
                    ref={(node) => registerSection('porsche', node as HTMLElement)}
                    className="min-h-screen flex items-center px-6 md:px-12"
                >
                    <div className="max-w-3xl space-y-6">
                        <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
                            Étape 04 • Performance
                        </p>
                        <h2
                            data-split
                            className="text-4xl md:text-6xl font-semibold"
                        >
                            Focus sur la Porsche 911 GT3 RS.
                        </h2>
                        <p className="text-white/75" data-animate="fade-up">
                            Vue plus serrée, angle ¾ avant, caméra plus basse : on rapproche
                            le regard de la carrosserie et des volumes pour un rendu
                            publicitaire.
                        </p>
                    </div>
                </section>

                {/* PORTAIL */}
                <section
                    id="portal"
                    ref={(node) => registerSection('portal', node as HTMLElement)}
                    className="min-h-screen flex items-center px-6 md:px-12"
                >
                    <div className="max-w-3xl space-y-6">
                        <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
                            Étape 05 • Portail
                        </p>
                        <h2
                            data-split
                            className="text-4xl md:text-6xl font-semibold"
                        >
                            Le portail vers l’univers complet.
                        </h2>
                        <p className="text-white/75" data-animate="fade-up">
                            La caméra reprend de la hauteur et recentre le portail dans le
                            cadre, comme une porte vers une expérience plus vaste (mode 3D,
                            scène libre, etc.).
                        </p>
                    </div>
                </section>

                {/* CTA */}
                <section
                    id="cta"
                    ref={(node) => registerSection('cta', node as HTMLElement)}
                    className="min-h-screen flex items-center px-6 md:px-12"
                >
                    
                </section>
            </main>

            <footer className="relative z-10 px-6 md:px-12 pb-10 text-white/50 text-sm uppercase tracking-[0.4em]">
                © 2024 Clément De Temmerman — Portfolio 3D expérimental
            </footer>

            <Preloader isVisible={isPreloaderVisible} />
            {showContact && <ContactModal onClose={() => setShowContact(false)} />}
        </div>
    );
};

export default NewHomePage;