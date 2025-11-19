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

import useSmoothScroll from '../hooks/useSmoothScroll';
import useSplitText from '../hooks/useSplitText';

gsap.registerPlugin(ScrollTrigger);

interface HomePageProps {
  onEnter3DMode: () => void;
}

type Vec3 = [number, number, number];

type ModelStopId = 'hero' | 'popclem' | 'hospital' | 'house' | 'portal';

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
    id: 'hero',
    position: [1.2, 3.2, 5],
    lookAt: [0, 1.2, 0],
  },
  {
    id: 'popclem',
    position: [0.6, 1.8, 1.5],
    lookAt: [0, 1.4, 0],
  },
  {
    id: 'hospital',
    position: [0.6, 0.4, 1.5],
    lookAt: [0, 0.4, 0],
  },
  {
    id: 'house',
    position: [0.6, -1.2, 1.5],
    lookAt: [0, -1.2, 0],
  },
  {
    id: 'portal',
    position: [0.6, -2.4, 1.5],
    lookAt: [0, -2.4, 0],
  },
];

/* map section -> index dans MODEL_STOPS */
const SECTION_TO_STOP_INDEX: Record<string, number | null> = {
  hero: 0,
  popclem: 1,
  hospital: 2,
  house: 3,
  portal: 4,
  cta: null,
};

/* -------------------------------------------------------------------------- */
/*                                 CAMERA RIG                                 */
/* -------------------------------------------------------------------------- */

interface CameraRigProps {
  activeStopIndex: number;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}

const CameraRig: React.FC<CameraRigProps> = ({ activeStopIndex, mouseRef }) => {
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
    const parallaxStrength = 0.25;

    // Calcule l'offset parallax
    const offsetX = mouse.x * parallaxStrength;
    const offsetY = -mouse.y * parallaxStrength;

    // Position cible du stop actif
    const stop = MODEL_STOPS[activeStopIndex];
    if (!stop) return;

    // Nouvelle position avec parallax
    const targetPos = new THREE.Vector3(
        stop.position[0] + offsetX,
        stop.position[1] + offsetY,
        stop.position[2]
    );

    // Interpolation douce vers la nouvelle position
    camera.position.lerp(targetPos, 0.08);

    // LookAt inchangé
    camera.lookAt(lookAtRef.current);

    // légère roll subtile
    const targetRoll = mouse.x * 0.04;
    camera.rotation.z = THREE.MathUtils.lerp(
        camera.rotation.z,
        targetRoll,
        0.08,
    );
});

  return null;
};

/* -------------------------------------------------------------------------- */
/*                                ISLAND SCENE                                */
/* -------------------------------------------------------------------------- */

interface IslandSceneProps {
  setHoveredId: (id: ModelStopId | null) => void;
}

const IslandScene: React.FC<IslandSceneProps> = ({ setHoveredId }) => {
  return (
    <>
      {/* éclairage global */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 6, 6]} intensity={1.4} />
      <directionalLight position={[-4, 4, -3]} intensity={0.5} />
      <Environment preset="sunset" />

      {/* POPClem ------------------------------------------------------------ */}
      <group position={[0, 1.15, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <POPClemStatic />
        {/* hotspot côté gauche */}
        <mesh
          position={[-2.3, 1.1, 0]}
          onPointerOver={() => setHoveredId('popclem')}
          onPointerOut={() => setHoveredId(null)}
        >
          <planeGeometry args={[3, 3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* Hôpital ------------------------------------------------------------ */}
      <group
        position={[-0.4, -0.1, 0]}
        rotation={[0, -(1.2 * Math.PI) / 2, 0]}
      >
        <HospitalGLTF position={[0, 0, 0]} scale={0.1} logoHide />
        <mesh
          position={[-2.5, 1.3, 0]}
          onPointerOver={() => setHoveredId('hospital')}
          onPointerOut={() => setHoveredId(null)}
        >
          <planeGeometry args={[4, 3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* Maison + pelleteuse ----------------------------------------------- */}
      <group position={[-0.8, -1.3, 0.9]} rotation={[0, -Math.PI / 2, 0]}>
        <House position={[-2, 0, 0]} scale={0.1} />
        <ExcavatorGLTF position={[0, 0, 0]} scale={0.1} logoHide />
        <mesh
          position={[-3, 1.3, 0]}
          onPointerOver={() => setHoveredId('house')}
          onPointerOut={() => setHoveredId(null)}
        >
          <planeGeometry args={[4, 3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* Portail ------------------------------------------------------------ */}
      <group position={[0, -12, 0]}>
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
  hero: {
    label: 'PORTFOLIO_OVERVIEW',
    title: 'Studio 3D',
    extra: [],
  },
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

  const { scrollTo } = useSmoothScroll();
  useSplitText('[data-split]', { stagger: 0.03, duration: 1 });

  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [hoveredId, setHoveredId] = useState<ModelStopId | null>(null);

  const sections = useMemo(
    () => [
      { id: 'hero', label: 'Accueil' },
      { id: 'popclem', label: 'Avatar' },
      { id: 'hospital', label: 'Hôpital' },
      { id: 'house', label: 'Maison' },
      { id: 'portal', label: 'Portail' },
      { id: 'cta', label: 'Contact' },
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
    <div className="relative min-h-screen text-white overflow-x-hidden bg-[#03030a]">
      {/* Canvas plein écran derrière l’UI */}
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 2, 10], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <CameraRig activeStopIndex={activeStopIndex} mouseRef={mouseRef} />
            <IslandScene setHoveredId={setHoveredId} />
          </Suspense>
        </Canvas>
      </div>

      {/* Effets de fond + HUD */}
      <AnimatedBackground />
      <HudOverlay hoveredId={hoveredId} />

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
            onClick={() => handleNavigation('portal')}
            className="hover:text-white transition-colors"
          >
            Portail
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

      {/* Contenu texte (sections 100vh) */}
      <main className="relative z-10 pt-32 pb-32 space-y-32">
        {/* HERO */}
        <section
          id="hero"
          ref={(node) => registerSection('hero', node as HTMLElement)}
          className="h-screen flex items-center px-6 md:px-12"
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
              Un parcours 3D continu, de l’avatar au portail.
            </h1>
            <p
              className="text-lg md:text-xl text-white/80 max-w-2xl"
              data-animate="fade-up"
            >
              Comme sur igloo.inc, le scroll pilote la caméra : chaque écran
              révèle un nouveau modèle 3D, accompagné de son HUD technique.
            </p>
          </div>
        </section>

        {/* POPCLEM */}
        <section
          id="popclem"
          ref={(node) => registerSection('popclem', node as HTMLElement)}
          className="h-screen flex items-center px-6 md:px-12"
        >
          <div className="max-w-3xl space-y-6">
            <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
              Étape 01 • Avatar
            </p>
            <h2 data-split className="text-4xl md:text-6xl font-semibold">
              POPClem ouvre la marche.
            </h2>
            <p className="text-white/75" data-animate="fade-up">
              Premier stop du voyage : l’avatar. La caméra se rapproche,
              légèrement en plongée, pendant que le HUD affiche les infos du
              personnage sur le côté.
            </p>
          </div>
        </section>

        {/* HÔPITAL */}
        <section
          id="hospital"
          ref={(node) => registerSection('hospital', node as HTMLElement)}
          className="h-screen flex items-center px-6 md:px-12"
        >
          <div className="max-w-3xl space-y-6">
            <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
              Étape 02 • Bâtiment
            </p>
            <h2 data-split className="text-4xl md:text-6xl font-semibold">
              Zoom out vers l’hôpital.
            </h2>
            <p className="text-white/75" data-animate="fade-up">
              On passe à l’échelle : la caméra recule, se décale, et le HUD
              affiche le contexte du bâtiment comme un artefact d’archives
              glacées.
            </p>
          </div>
        </section>

        {/* MAISON + PELLETEUSE */}
        <section
          id="house"
          ref={(node) => registerSection('house', node as HTMLElement)}
          className="h-screen flex items-center px-6 md:px-12"
        >
          <div className="max-w-3xl space-y-6">
            <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
              Étape 03 • Chantier
            </p>
            <h2 data-split className="text-4xl md:text-6xl font-semibold">
              Maison & pelleteuse, en diptyque.
            </h2>
            <p className="text-white/75" data-animate="fade-up">
              Architecture et mécanique réunies dans une même scène. La caméra
              glisse latéralement, le HUD réagit au survol du côté gauche de la
              composition.
            </p>
          </div>
        </section>

        {/* PORTAIL */}
        <section
          id="portal"
          ref={(node) => registerSection('portal', node as HTMLElement)}
          className="h-screen flex items-center px-6 md:px-12"
        >
          <div className="max-w-3xl space-y-6">
            <p className="text-xs uppercase tracking-[0.5em] text-purple-300">
              Étape 04 • Portail
            </p>
            <h2 data-split className="text-4xl md:text-6xl font-semibold">
              Le portail vers l’univers complet.
            </h2>
            <p className="text-white/75" data-animate="fade-up">
              Dernier stop : le portail. Il sert de passerelle vers ton mode
              3D libre, pendant que le HUD affiche l’entrée “PORTFOLIO_CO_04”.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section
          id="cta"
          ref={(node) => registerSection('cta', node as HTMLElement)}
          className="h-screen flex items-center px-6 md:px-12"
        >
          <div className="rounded-[40px] border border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-3xl text-center py-20 px-8 space-y-8 max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-[0.5em] text-white/60">
              Next step
            </p>
            <h3 data-split className="text-4xl md:text-6xl font-semibold">
              On applique ce pattern à ton prochain projet ?
            </h3>
            <p className="text-white/70">
              Scroll → mouvement de caméra → HUD contextuel → narration 3D
              cohérente. Le pattern est prêt à être adapté pour n’importe quel
              produit ou univers.
            </p>
            <div
              className="flex flex-wrap justify-center gap-4"
              data-animate="fade-up"
            >
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="px-10 py-4 rounded-full border border-white/20 uppercase tracking-[0.4em]"
              >
                Écrire
              </button>
              <button
                type="button"
                onClick={onEnter3DMode}
                className="px-10 py-4 rounded-full bg-white text-black font-semibold uppercase tracking-[0.4em]"
              >
                Mode libre 3D
              </button>
            </div>
          </div>
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
