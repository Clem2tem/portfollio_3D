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
import POPBoxed from './BoxedPOP';
import BoxedHospital from './BoxedHospital';
import HouseBox from './BoxedHouse';

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- */
/*                            GLITCH TEXT                                     */
/* -------------------------------------------------------------------------- */

interface GlitchTextProps {
  text: string;
  className?: string; // Permet d'ajouter vos propres classes
}

const CONFIG = {
  waveSpeed: 0.5,      // Vitesse du projectile relâché
  waveWidth: 15,       // Épaisseur de la zone d'impact
  waveLife: 1000,      // Durée de vie projectile (ms)
  initialRadius: 15,   // Rayon de la tête chercheuse autour de la souris
  glitchChance: 0.4,   // Très probable si touché
  colors: ["#ff00ff", "#00ffff", "#f0f"], // Couleurs cyber
  chars: "XMW_-/\\:<>[]{}*+=?#", // Caractères de remplacement
  coneThreshold: 0.5,  // Définit l'angle du cône avant (plus proche de 1 = plus étroit)
  stopTimeout: 25,    // Temps d'arrêt avant de lâcher le projectile
};

interface Ripple {
  x: number; y: number;   // Position actuelle du centre de l'onde
  vx: number; vy: number; // Direction normalisée
  time: number;           // Temps de référence pour l'animation
  id: number;
  released: boolean;      // État du projectile
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  
  const ripples = useRef<Ripple[]>([]);
  const activeRippleRef = useRef<Ripple | null>(null);
  
  const lastDirRef = useRef<{ x: number; y: number } | null>(null);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

  const randomChar = () => CONFIG.chars[Math.floor(Math.random() * CONFIG.chars.length)];

  // --- BOUCLE D'ANIMATION PRINCIPALE ---
  useEffect(() => {
    let frameId: number;

    const loop = () => {
      const now = performance.now();
      const container = containerRef.current;
      if (!container) return;

      // 1. Nettoyage des projectiles expirés
      ripples.current = ripples.current.filter((r) => 
        !r.released || (now - r.time < CONFIG.waveLife)
      );

      // 2. Calculs physiques et rendu
      spansRef.current.forEach((span, index) => {
        if (!span) return;

        // Reset du style par défaut au début de la frame
        span.innerText = text[index];
        span.style.transform = "none";
        span.style.color = "inherit";
        span.style.textShadow = "none";
        span.style.opacity = "1";

        const rect = span.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const charX = rect.left - containerRect.left + rect.width / 2;
        const charY = rect.top - containerRect.top + rect.height / 2;

        let isAffected = false;
        let intensity = 0;

        ripples.current.forEach((ripple) => {
          const age = now - ripple.time;
          let waveCenterX = ripple.x;
          let waveCenterY = ripple.y;

          // Si relâchée, le centre avance comme un projectile
          if (ripple.released) {
            const distanceTraveled = age * CONFIG.waveSpeed;
            waveCenterX += ripple.vx * distanceTraveled;
            waveCenterY += ripple.vy * distanceTraveled;
          }

          // Vecteur entre le centre de l'onde et le caractère
          const dx = charX - waveCenterX;
          const dy = charY - waveCenterY;
          const distToWaveCenter = Math.sqrt(dx * dx + dy * dy);

          // --- LOGIQUE DIRECTIONNELLE STRICTE ---
          let isInFront = false;
          // On ne calcule que s'il y a une direction et que le char n'est pas pile au centre
          if ((ripple.vx !== 0 || ripple.vy !== 0) && distToWaveCenter > 0) {
             // Normalisation du vecteur vers le caractère
             const ndx = dx / distToWaveCenter;
             const ndy = dy / distToWaveCenter;
             // Produit scalaire normalisé = cosinus de l'angle
             const dot = ndx * ripple.vx + ndy * ripple.vy;
             // On vérifie si c'est dans le cône avant défini par le seuil
             isInFront = dot > CONFIG.coneThreshold;
          }

          // Le rayon d'intérêt est constant (la taille de la "tête" de l'onde)
          const radiusOfInterest = CONFIG.initialRadius;

          // Collision : Dans le cône avant ET sur le bord du cercle
          if (isInFront && Math.abs(distToWaveCenter - radiusOfInterest) < CONFIG.waveWidth) {
            isAffected = true;
            const currentIntensity = 1 - Math.abs(distToWaveCenter - radiusOfInterest) / CONFIG.waveWidth;
            intensity = Math.max(intensity, currentIntensity);
          }
        });

        // 3. Application du Glitch (SI affecté)
        if (isAffected && Math.random() < CONFIG.glitchChance) {
          span.innerText = randomChar();
          
          // CORRECTION POINT 4 : Pas de translate, juste un scale léger
          span.style.transform = `scale(${1 + intensity * 0.15})`; 
          
          span.style.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
          
          // L'effet RGB shift se fait via text-shadow, sans bouger le texte lui-même
          const shadowDist = intensity * 3;
          span.style.textShadow = `
            ${shadowDist}px 0 0 ${CONFIG.colors[0]}, 
            -${shadowDist}px 0 0 ${CONFIG.colors[1]}
          `;
        }
      });

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [text]);

  // --- GESTION SOURIS (Identique à la version précédente) ---
  const releaseActiveRipple = () => {
      if (activeRippleRef.current) {
          activeRippleRef.current.released = true;
          activeRippleRef.current.time = performance.now(); 
          activeRippleRef.current = null;
      }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(releaseActiveRipple, CONFIG.stopTimeout);

    if (lastMousePos.current) {
        const dx = x - lastMousePos.current.x;
        const dy = y - lastMousePos.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 2) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            let shouldCreateNew = false;

            if (lastDirRef.current && activeRippleRef.current) {
                const dot = dirX * lastDirRef.current.x + dirY * lastDirRef.current.y;
                // Si virage trop sec (produit scalaire < 0.7 environ 45deg)
                if (dot < 0.7) shouldCreateNew = true;
            }

            if (shouldCreateNew || !activeRippleRef.current) {
                releaseActiveRipple();
                const newRipple: Ripple = {
                    x, y, vx: dirX, vy: dirY,
                    time: performance.now(), id: Math.random(), released: false
                };
                ripples.current.push(newRipple);
                activeRippleRef.current = newRipple;
            } else {
                activeRippleRef.current.x = x;
                activeRippleRef.current.y = y;
                activeRippleRef.current.vx = dirX;
                activeRippleRef.current.vy = dirY;
            }
            lastDirRef.current = { x: dirX, y: dirY };
        }
    }
    lastMousePos.current = { x, y };
  };

  const handleMouseLeave = () => {
      releaseActiveRipple();
      lastMousePos.current = null;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    // CORRECTION POINT 1 & 2 : Pas de style de fond, et ajout de white-space: pre-wrap pour retour à la ligne auto
    className={`relative ${className}`}
    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} 
    >
    {text.split("").map((char, index) => (
        <span
          key={index}
          ref={(el) => {spansRef.current[index] = el}}
          // will-change est important pour la fluidité sur Chrome
          className="will-change-[transform,text-shadow,color]"
        >
          {char}
        </span>
      ))}
    </div>
  );
};



/* -------------------------------------------------------------------------- */
/*                            TECH CAROUSEL                                   */
/* -------------------------------------------------------------------------- */

const technologies = [
    { name: 'React', ext: 'png' },
    { name: 'Node.js', ext: 'png' },
    { name: 'Next.js', ext: 'png' },
    { name: 'TypeScript', ext: 'svg' },
    { name: 'Firebase', ext: 'png' },
    { name: 'Supabase', ext: 'png' },
    { name: 'Vercel', ext: 'svg' },
    { name: 'Git', ext: 'png' },
    { name: 'Google_Cloud', ext: 'svg' },
];

function TechCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % technologies.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const currentTech = technologies[currentIndex];

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + technologies.length) % technologies.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % technologies.length);
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 p-4">

            <div className="relative w-full flex items-center justify-center gap-4">
                {/* Flèche gauche */}
                <button
                    onClick={goToPrevious}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Previous technology"
                >
                    <svg
                        className="w-6 h-6 text-white/70 hover:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                {/* Image */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <img
                        key={currentIndex}
                        src={`/logos/technos/${currentTech.name}.${currentTech.ext}`}
                        alt={currentTech.name}
                        className="max-w-full max-h-full object-contain transition-all duration-500 ease-out"
                        style={{
                            animation: 'fadeInScale 0.5s ease-out',
                            filter: 'drop-shadow(0 0 8px rgba(123, 0, 139, 1))',
                        }}
                    />
                </div>

                {/* Flèche droite */}
                <button
                    onClick={goToNext}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Next technology"
                >
                    <svg
                        className="w-6 h-6 text-white/70 hover:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>

            <p className="text-sm text-white/70 font-mono">
                {currentTech.name.replace(/_/g, ' ')}
            </p>

            <div className="flex gap-1.5">
                {technologies.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                            ? 'bg-white w-8'
                            : 'bg-white/30 w-1.5 hover:bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}


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
    isPopZoomed?: boolean;
    isMiniaturized?: boolean;
}

const CameraRig: React.FC<CameraRigProps> = ({ activeStopIndex, mouseRef, onCameraPositionChange, isPopZoomed, isMiniaturized }) => {
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

    // 2. tween quand la section change ou zoom
    useEffect(() => {
        if (isPopZoomed) {
            // Zoom sur POPClem
            gsap.to(camera.position, {
                x: 1,
                y: 2.8,
                z: 0,
                duration: 1.2,
                ease: 'power3.inOut',
            });
            gsap.to(lookAtRef.current, {
                x: 0,
                y: 2.8,
                z: 0,
                duration: 1.2,
                ease: 'power3.inOut',
            });
            return;
        }

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
    }, [activeStopIndex, camera, isPopZoomed]);

    // 3. parallax + légère rotation subtile (Option A)
    useFrame(() => {
        if (isMiniaturized) return; // Pause parallax when miniaturized

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
        if (mouse.x < -0.5 && !isPopZoomed) {
            targetPos = new THREE.Vector3(
                stop.position[0] * (1 - Math.abs(mouse.x)),
                stop.position[1] - offsetY,
                stopOffsets[stop.id]
            );
        } else if (mouse.x > 0.5 && !isPopZoomed) {
            targetPos = new THREE.Vector3(
                stop.position[0] * (1 - Math.abs(mouse.x)),
                stop.position[1],
                -stopOffsets[stop.id]
            );
        } else {
            // Nouvelle position avec parallax
            targetPos = new THREE.Vector3(
                stop.position[0],
                isPopZoomed ? 2.8 + offsetY : stop.position[1] + offsetY,
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

    return (
        <>
            {/* Lumière attachée à la caméra */}
            <directionalLight position={[camera.position.x, camera.position.y, camera.position.z]} intensity={1} />
            <directionalLight position={[0, camera.position.y + 1, -3]} intensity={1} />
            <directionalLight position={[0, camera.position.y + 1, 3]} intensity={1} />
        </>
    );
};

/* -------------------------------------------------------------------------- */
/*                                ISLAND SCENE                                */
/* -------------------------------------------------------------------------- */

interface IslandSceneProps {
    setHoveredId: (id: ModelStopId | null) => void;
    mouseRef: React.MutableRefObject<{ x: number; y: number }>;
    isPopZoomed: boolean;
    setIsPopZoomed: (v: boolean) => void;
}

const IslandScene: React.FC<IslandSceneProps> = ({ setHoveredId, isPopZoomed, setIsPopZoomed }) => {
    const [popBoxReverse, setPopBoxReverse] = useState(false);
    const popClemRef = useRef<THREE.Group>(null);

    useEffect(() => {
        if (popClemRef.current) {
            gsap.to(popClemRef.current.position, {
                y: isPopZoomed ? 1 : 0,
                duration: 1,
                ease: 'power3.inOut'
            });
        }
    }, [isPopZoomed]);

    return (
        <>
            <Environment
                preset="sunset"
                environmentIntensity={0.5}
                backgroundIntensity={0} // pas de lumière
                blur={0.5}
            />
            {/* POPClem ------------------------------------------------------------ */}
            <group position={[0, 1.5, 0]} rotation={[0, 1.1 * Math.PI / 8, 0]}>
                <group ref={popClemRef}>
                    <POPClemStatic />
                </group>
                <POPBoxed
                    position={[0, 0, 0]}
                    scale={0.05}
                    rotation={[0, Math.PI / 3, 0]}
                    playAnimation={isPopZoomed || !popBoxReverse}
                    playReverse={!isPopZoomed && popBoxReverse}
                    onPointerOver={() => {
                        if (!isPopZoomed) setPopBoxReverse(true);
                    }}
                    onPointerOut={() => {
                        if (!isPopZoomed) setPopBoxReverse(false);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsPopZoomed(!isPopZoomed);
                    }}
                />
            </group>

            {/* Hôpital ------------------------------------------------------------ */}
            <group
                position={[0, 0, 0.27]}
                rotation={[0, -(0.96 * Math.PI) / 6, 0]}
            >
                <HospitalGLTF position={[0, 0, 0]} scale={0.1} logoHide />
                <BoxedHospital position={[0, 0, 0]} scale={0.1} rotation={[0, (0.96 * Math.PI) / 6, 0]} />
                <ToyBox
                    position={[0.05, 0.4, -0.2]}
                    rotation={[0, (4 * Math.PI / 6), 0]}
                    size={[1.5, 0.7, 0.8]} // W / H / D
                    thickness={0}
                    color="#1a2d58"
                    headerHeight={0}
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
                <HouseBox position={[0, -0.12, -0.24]} scale={0.1} rotation={[0, (0.91 * Math.PI / 7) + Math.PI / 2, 0]} />
                <ToyBox
                    position={[0.35, 0.30, 0]}
                    rotation={[0, (1.9 * Math.PI / 3), 0]}
                    size={[2.2, 0.7, 1.5]} // W / H / D
                    thickness={0}
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
        <div className="fixed inset-0 z-30">
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
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [showContact, setShowContact] = useState(false);
    const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);
    const [isPopZoomed, setIsPopZoomed] = useState(false);
    const [isMiniaturized, setIsMiniaturized] = useState(false);
    const [lang, setLang] = useState<'fr' | 'en'>('fr');

    useEffect(() => {
        if (isPopZoomed) {
            const timer = setTimeout(() => {
                setIsMiniaturized(true);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [isPopZoomed]);

    const handleReturnFromBento = () => {
        if (isMiniaturized) {
            setTimeout(() => {
                setIsMiniaturized(false);
                // Attendre la fin de la transition d'agrandissement (1s) avant de dézoomer la caméra
                setTimeout(() => setIsPopZoomed(false), 1000);
            }, 1000);
        }
    };


    function FixCameraAspect() {
        const { camera, size } = useThree();
        useFrame(() => {
            if (camera instanceof THREE.PerspectiveCamera) {
                camera.aspect = size.width / size.height;
                camera.updateProjectionMatrix();
            }
        });
        return null;
    }

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
                title: 'E-Learning app',
                description: 'Ce projet marque le début de ma carrière professionnelle. Une application de e-learning pour les chercheurs en pharmacologie et les étudiants de l\'IUT de Lille. Vous découvrirez ensuite les détails des projets auquels j\'ai contribué dans une navigation intéractive.'
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
        <div className={`relative min-h-screen text-white overflow-x-hidden`}>
            <AnimatedBackground />
            <div className={`fixed top-0 left-0 z-40 h-[100dvh] w-[100dvw] transition-opacity bg-black/70 duration-1000 ${isMiniaturized ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Bouton fermer en haut à droite */}
                <button
                    onClick={handleReturnFromBento}
                    className="absolute top-16 right-8 p-3 z-[9999] rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
                    aria-label="Fermer"
                >
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Contenu centré */}
                <div className="flex flex-col items-center justify-center h-full px-[20dvw] gap-12 relative">
                    <p className="text-2xl md:text-3xl font-mono text-center leading-snug absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2">
                        <GlitchText text="Je m'appelle Clément, créateur de solutions digitales pour aider les entreprises et particuliers à digitaliser leurs outils et marketing. Je vous accompagnerai afin de réaliser les projets de vos rêves, que ce soit d'un simple site web jusqu'à une application complexe." />
                    </p>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full flex justify-center">
                        <TechCarousel />
                    </div>
                </div>
            </div>
            {/* Canvas plein écran derrière l’UI */}
            <div
                ref={canvasContainerRef}
                className={`fixed transition-all duration-1000 ease-in-out z-0 overflow-hidden top-0 left-0 w-full h-full rounded-none`}
            >

                {/** ⬇️ WRAPPER STABLE (ne bouge jamais) */}
                <div
                    className="
            absolute 
            top-1/2 left-1/2 
            -translate-x-1/2 -translate-y-1/2
            w-[100dvw] h-[100dvh]
            z-50
            pointer-events-none
            "

                >
                    <Canvas
                        camera={{ position: [0, 2, 10], fov: 45 }}
                        gl={{ antialias: true, alpha: true }}
                        className="w-full h-full"
                    >
                        <Suspense fallback={null}>
                            <FixCameraAspect />
                            <CameraRig
                                activeStopIndex={activeStopIndex}
                                mouseRef={mouseRef}
                                isPopZoomed={isPopZoomed}
                                isMiniaturized={isMiniaturized}
                            />
                            <IslandScene
                                setHoveredId={setHoveredId}
                                mouseRef={mouseRef}
                                isPopZoomed={isPopZoomed}
                                setIsPopZoomed={setIsPopZoomed}
                            />
                        </Suspense>
                    </Canvas>

                    <div
                        className={`
                absolute inset-0 rounded-3xl
                transition-opacity duration-500 pointer-events-none 
                ${isMiniaturized ? 'opacity-100' : 'opacity-0'}
            `}
                    />
                </div>
            </div>

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 flex items-center justify-between ${isMiniaturized ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} `}>
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

            {/* UI Standard - Fade out */}
            <div className={`transition-opacity duration-500 pointer-events-none ${isPopZoomed ? 'opacity-0 ' : 'opacity-100'}`}>

                {/* Effets de fond + HUD */}

                <HudOverlay hoveredId={hoveredId} />


                {/* Stepper latéral */}
                <SectionNavigation
                    sections={sections}
                    activeId={activeSection}
                    onSelect={handleNavigation}
                />

                {/* Contenu texte (sections 100vh) */}
                <main className="relative z-20 pt-32 pb-32 space-y-32 pointer-events-none background-none">

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
                                className="text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
                            >
                                {t.popclem.title}
                            </h1>
                            <p
                                className="text-lg md:text-xl text-white max-w-2xl drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
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
                        className="h-screen flex items-end px-6 md:px-12 pb-20"
                    >
                        <div className="max-w-4xl space-y-8">
                            <p
                                className="text-xs uppercase tracking-[0.5em] text-white/60"
                                data-animate="fade-up"
                            >
                                {t.hospital.step}
                            </p>
                            <h1
                                data-split
                                className="text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
                            >
                                {t.hospital.title}
                            </h1>
                            <p
                                className="text-lg md:text-xl text-white max-w-4xl drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
                                data-animate="fade-up"
                            >
                                {t.hospital.description}
                            </p>
                        </div>
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
        </div>
    );
};

export default NewHomePage;
