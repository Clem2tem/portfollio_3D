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

import AnimatedBackground from '../AnimatedBackground';
import ContactModal from '../ContactModal';
import Preloader from '../Preloader';
import SectionNavigation from '../SectionNavigation';

import POPClemStatic from '../POPClemStatic';
import HospitalGLTF from '../HospitalGLTF';
import House from '../House';
import ExcavatorGLTF from '../ExcavatorGLTF';

import useSmoothScroll from '../../hooks/useSmoothScroll';
import useSplitText from '../../hooks/useSplitText';
import ToyBox from '../ToyBox';
import { Environment } from '@react-three/drei';
import POPBoxed from '../BoxedPOP';
import BoxedHospital from '../BoxedHospital';
import HouseBox from '../BoxedHouse';
import Carousel from './Carousel';
import ProjectDetailsPanel from './ProjectInfos';

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- */
/*                            GLITCH TEXT                                     */
/* -------------------------------------------------------------------------- */

interface GlitchTextProps {
    text: string;
    className?: string;
}

const CONFIG = {
    waveSpeed: 0.5,
    waveWidth: 15,
    waveLife: 1000,
    initialRadius: 20,
    glitchChance: 0.8,
    colors: ["#ff00ff", "#00ffff", "#f0f"],
    chars: "XMW_-/\\:<>[]{}*+=?#",
    coneThreshold: 0.4,
    stopTimeout: 150,
    introWaveSpeed: 0.6,
    introWaveLife: 5000,
    introWaveWidthMult: 2,
    revealDelay: 2000, // Temps max avant affichage forcé
};

interface Ripple {
    x: number; y: number;
    vx: number; vy: number;
    time: number;
    id: number;
    released: boolean;
    isIntro?: boolean;
}

interface CharData {
    centerX: number;
    centerY: number;
    char: string;
    isGlitching: boolean;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "" }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

    // Cache des positions pour la performance
    const charPositions = useRef<CharData[]>([]);

    const ripples = useRef<Ripple[]>([]);
    const activeRippleRef = useRef<Ripple | null>(null);
    const revealedIndices = useRef(new Set<number>());
    const forceRevealRef = useRef(false);

    const lastDirRef = useRef<{ x: number; y: number } | null>(null);
    const lastMousePos = useRef<{ x: number; y: number } | null>(null);
    const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

    const randomChar = () => CONFIG.chars[Math.floor(Math.random() * CONFIG.chars.length)];

    // --- 1. CALCUL DES POSITIONS ---
    const measureChars = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        // On force un recalcul propre
        const containerRect = container.getBoundingClientRect();

        charPositions.current = spansRef.current.map((span, index) => {
            if (!span) return { centerX: 0, centerY: 0, char: text[index], isGlitching: false };

            const rect = span.getBoundingClientRect();
            return {
                // Coordonnées relatives au conteneur
                centerX: rect.left - containerRect.left + rect.width / 2,
                centerY: rect.top - containerRect.top + rect.height / 2,
                char: text[index],
                isGlitching: false
            };
        });
    }, [text]);

    // Observer le redimensionnement et le chargement initial
    useEffect(() => {
        // Petit délai pour laisser le temps au layout de se faire (important pour la position exacte)
        const timer = setTimeout(measureChars, 50);
        window.addEventListener("resize", measureChars);
        return () => {
            window.removeEventListener("resize", measureChars);
            clearTimeout(timer);
        }
    }, [measureChars]);

    // --- 2. TIMEOUT DE RÉVÉLATION (Fallback) ---
    useEffect(() => {
        forceRevealRef.current = false;
        const timer = setTimeout(() => {
            forceRevealRef.current = true;
        }, CONFIG.revealDelay);
        return () => clearTimeout(timer);
    }, [text]);

    // --- 3. LANCEMENT DE L'ONDE D'INTRO ---
    useEffect(() => {
        revealedIndices.current.clear();
        const dirX = 0.7071;
        const dirY = 0.7071;

        ripples.current.push({
            x: -150, y: -150, // Départ bien en dehors
            vx: dirX, vy: dirY,
            time: performance.now(),
            id: Math.random(),
            released: true,
            isIntro: true,
        });
    }, [text]);

    // --- 4. BOUCLE D'ANIMATION ---
    useEffect(() => {
        let frameId: number;

        const loop = () => {
            const now = performance.now();

            // Nettoyage des ondes expirées
            ripples.current = ripples.current.filter((r) => {
                const life = r.isIntro ? CONFIG.introWaveLife : CONFIG.waveLife;
                return !r.released || (now - r.time < life);
            });

            // Boucle optimisée sur les données en cache
            charPositions.current.forEach((charData, index) => {
                const span = spansRef.current[index];
                if (!span) return;

                let isAffected = false;
                let intensity = 0;

                // A. D'ABORD : Calculer les collisions (MÊME si invisible)
                ripples.current.forEach((ripple) => {
                    const age = now - ripple.time;
                    let waveCenterX = ripple.x;
                    let waveCenterY = ripple.y;
                    const speed = ripple.isIntro ? CONFIG.introWaveSpeed : CONFIG.waveSpeed;

                    if (ripple.released) {
                        const distanceTraveled = age * speed;
                        waveCenterX += ripple.vx * distanceTraveled;
                        waveCenterY += ripple.vy * distanceTraveled;
                    }

                    const dx = charData.centerX - waveCenterX;
                    const dy = charData.centerY - waveCenterY;

                    if (ripple.isIntro) {
                        // Logique de "Ligne de front" infinie pour l'intro
                        const distanceToWaveFront = dx * ripple.vx + dy * ripple.vy;
                        const introWidth = CONFIG.waveWidth * CONFIG.introWaveWidthMult;

                        if (Math.abs(distanceToWaveFront) < introWidth) {
                            isAffected = true;
                            intensity = Math.max(intensity, 1 - Math.abs(distanceToWaveFront) / introWidth);

                            // C'est ici qu'on révèle le caractère !
                            if (!revealedIndices.current.has(index)) {
                                revealedIndices.current.add(index);
                            }
                        }
                    } else {
                        // Logique "Projectile" pour la souris
                        const distToWaveCenter = Math.sqrt(dx * dx + dy * dy);
                        let isInFront = false;
                        // Vérification directionnelle si l'onde bouge
                        if ((ripple.vx !== 0 || ripple.vy !== 0) && distToWaveCenter > 0) {
                            const ndx = dx / distToWaveCenter;
                            const ndy = dy / distToWaveCenter;
                            const dot = ndx * ripple.vx + ndy * ripple.vy;
                            isInFront = dot > CONFIG.coneThreshold;
                        }
                        const radiusOfInterest = CONFIG.initialRadius;

                        if (isInFront && Math.abs(distToWaveCenter - radiusOfInterest) < CONFIG.waveWidth) {
                            isAffected = true;
                            const currentIntensity = 1 - Math.abs(distToWaveCenter - radiusOfInterest) / CONFIG.waveWidth;
                            intensity = Math.max(intensity, currentIntensity);
                        }
                    }
                });

                // B. ENSUITE : Gérer l'opacité (Maintenant qu'on sait si c'est révélé)
                const isRevealed = revealedIndices.current.has(index);
                const shouldShow = isRevealed || forceRevealRef.current;
                const targetOpacity = shouldShow ? "1" : "0";

                // Application optimisée de l'opacité
                if (span.style.opacity !== targetOpacity) {
                    span.style.opacity = targetOpacity;
                }

                // C. ENFIN : Si toujours invisible, on arrête là pour ce caractère (Optimisation)
                if (!shouldShow) return;

                // D. Application du Glitch visuel
                if (isAffected && Math.random() < CONFIG.glitchChance) {
                    charData.isGlitching = true;
                    span.innerText = randomChar();
                    span.style.transform = `scale(${1 + intensity * 0.15})`;
                    span.style.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
                    const shadowDist = intensity * 3;
                    span.style.textShadow = `${shadowDist}px 0 0 ${CONFIG.colors[0]}, -${shadowDist}px 0 0 ${CONFIG.colors[1]}`;

                } else if (charData.isGlitching) {
                    // Reset propre quand le glitch s'arrête
                    span.innerText = charData.char;
                    span.style.transform = "none";
                    span.style.color = "inherit";
                    span.style.textShadow = "none";
                    charData.isGlitching = false;
                }
            });

            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [text]);

    // --- GESTION SOURIS (Inchangée) ---
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
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 2) {
                const dirX = dx / dist;
                const dirY = dy / dist;
                let shouldCreateNew = false;
                if (lastDirRef.current && activeRippleRef.current) {
                    const dot = dirX * lastDirRef.current.x + dirY * lastDirRef.current.y;
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
            className={`relative ${className}`}
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
            {text.split("").map((char, index) => (
                <span
                    key={index}
                    ref={(el) => { spansRef.current[index] = el }}
                    className="will-change-[transform,text-shadow,opacity]"
                    style={{ opacity: 0 }}
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
    { name: 'Vue', ext: 'png' },
    { name: 'Next.js', ext: 'png' },
    { name: 'Node.js', ext: 'png' },
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
                    data-cursor="pointer"

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
                    className="p-2 rounded-full hover:bg-white/10 transition-colors "
                    data-cursor="pointer"
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
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentIndex
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
        position: [1.5, 0.4, 0],
        lookAt: [0, 0.4, 0],
    },
    {
        id: 'house',
        position: [1.5, -1.2, 0],
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
    dragOffset: { x: number; y: number };
    dragAccumulated: { x: number; y: number };
    onCameraPositionChange?: (position: Vec3) => void;
    onAutoRotate?: (rotation: number) => void;
    isPopZoomed?: boolean;
    isMiniaturized?: boolean;
    isDragging: boolean;
}

const CameraRig: React.FC<CameraRigProps> = ({ activeStopIndex, dragOffset, dragAccumulated, onCameraPositionChange, onAutoRotate, isPopZoomed, isMiniaturized, isDragging }) => {
    const { camera } = useThree();
    const lookAtRef = useRef(new THREE.Vector3(0, 1.2, 0));
    const hasInitialised = useRef(false);
    const autoRotateRef = useRef(0);
    const lastDragTimeRef = useRef(Date.now());
    const wasAutoRotatingRef = useRef(false);

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

    // 3. Drag camera movement - Orbite circulaire avec auto-rotation
    useFrame((_state, delta) => {
        if (isMiniaturized) return;

        // Mettre à jour le timestamp si on drag
        if (isDragging) {
            lastDragTimeRef.current = Date.now();
        }

        // Vérifier si on doit activer l'auto-rotation (3 secondes d'inactivité)
        const timeSinceLastDrag = Date.now() - lastDragTimeRef.current;
        const shouldAutoRotate = timeSinceLastDrag > 3000 && !isDragging;

        // Combiner drag manuel + auto-rotation
        let totalDragX = dragOffset.x + dragAccumulated.x;

        if (shouldAutoRotate) {
            // Rotation automatique lente (0.1 radians par seconde)
            autoRotateRef.current += delta * 0.1;
            totalDragX += autoRotateRef.current / Math.PI;
            wasAutoRotatingRef.current = true;
            // Communiquer la rotation au parent
            if (onAutoRotate) {
                onAutoRotate(autoRotateRef.current / Math.PI);
            }
        } else if (wasAutoRotatingRef.current) {
            // On vient de sortir de l'auto-rotation, reset
            autoRotateRef.current = 0;
            wasAutoRotatingRef.current = false;
        }

        // Position cible du stop actif
        const stop = MODEL_STOPS[activeStopIndex];
        if (!stop) return;

        // Calcul de l'angle basé sur le drag horizontal
        const angle = totalDragX * Math.PI;

        // Rayon de l'orbite (distance au centre sur le plan XZ)
        const radius = 1.5;

        // Calcul de la position circulaire autour de l'origine
        const circleX = Math.cos(angle) * radius;
        const circleZ = Math.sin(angle) * radius;

        // Clamper X entre -1.5 et 1.5
        const clampedX = THREE.MathUtils.clamp(circleX, -1.5, 1.5);

        const targetPos = new THREE.Vector3(clampedX, stop.position[1], circleZ);

        // Interpolation douce vers la nouvelle position
        camera.position.lerp(targetPos, 0.08);

        // Update camera position callback
        if (onCameraPositionChange) {
            onCameraPositionChange([camera.position.x, camera.position.y, camera.position.z]);
        }

        // LookAt vers le centre de la scène
        camera.lookAt(lookAtRef.current);

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
    isPopZoomed: boolean;
}

const IslandScene: React.FC<IslandSceneProps> = ({ isPopZoomed }) => {
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
                    playAnimation={true}
                    playReverse={false}
                />
            </group>

            {/* Hôpital ------------------------------------------------------------ */}
            <group
                position={[0, 0.2, 0.17]}
                rotation={[0, -(0.96 * Math.PI) / 6, 0]}
                scale={0.5}
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
            <group position={[0, -1.3, 0]} rotation={[0, - 0.91 * Math.PI / 7, 0]} scale={0.3}>
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
        </>
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
                description: "MedChem Structure Genius est une application d’e-learning destinée aux étudiants de la Faculté de Pharmacie de l'Université de Lille pour les aider à étudier les molécules et leurs relations."
            },
            house: {
                step: 'SAAS ERP - EGS',
                title: 'Maison & pelleteuse, en diptyque.',
                description: 'SaaS métier développé pour une entreprise du BTP, visant à centraliser la gestion des chantiers, automatiser la génération de devis et fiabiliser le suivi financier des projets.'
            },
            footer: '© 2025 Clément De Temmerman — Portfolio 3D expérimental'
        },
        en: {
            subtitle: 'Clément',
            title: 'FullStack Engineer / Software Engineer',
            contact: 'Contact',
            mode3d: '3D Mode',
            popclem: {
                step: 'ME',
                title: 'Hello!',
                description: 'That\'s me! Through this interactive portfolio, discover my journey and skills.'
            },
            hospital: {
                step: 'MEDCHEM STRUCTURE GENIUS',
                title: 'E-Learning App',
                description: 'MedChem Structure Genius is an e-learning application designed for students at the Faculty of Pharmacy, University of Lille, to help them study molecules and their relationships.'
            },
            house: {
                step: 'SAAS ERP - EGS',
                title: 'House & excavator, in diptych.',
                description: 'Business SaaS developed for a construction company, aimed at centralizing site management, automating quote generation, and ensuring reliable financial tracking of projects.'
            },
            footer: '© 2025 Clément De Temmerman — Experimental 3D Portfolio'
        }
    }), []);

    const t = translations[lang];

    const { scrollTo } = useSmoothScroll();
    useSplitText('[data-split]', { stagger: 0.03, duration: 1 });

    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const autoRotationAccumulatedRef = useRef(0);
    const [dragAccumulated, setDragAccumulated] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const [activeSection, setActiveSection] = useState<string>('popclem');
    const [activeStopIndex, setActiveStopIndex] = useState<number>(0);

    const sections = useMemo(
        () => [
            { id: 'popclem', label: t.popclem.step },
            { id: 'hospital', label: t.hospital.step },
            { id: 'house', label: t.house.step },
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

    // Handlers de drag pour le canvas
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Si on était en auto-rotation, figer la position actuelle
        if (autoRotationAccumulatedRef.current !== 0) {
            setDragAccumulated(prev => ({
                x: prev.x + autoRotationAccumulatedRef.current,
                y: prev.y
            }));
            autoRotationAccumulatedRef.current = 0;
        }
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDraggingRef.current) return;

        const deltaX = (e.clientX - dragStartRef.current.x) / window.innerWidth;
        const deltaY = (e.clientY - dragStartRef.current.y) / window.innerHeight;

        setDragOffset({ x: deltaX * 2, y: deltaY * 2 });
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (isDraggingRef.current) {
            // Accumuler le drag actuel + la rotation auto si elle existait
            setDragAccumulated(prev => ({
                x: prev.x + dragOffset.x,
                y: prev.y + dragOffset.y
            }));
        }
        isDraggingRef.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        // Reset le drag temporaire
        setDragOffset({ x: 0, y: 0 });
    }, [dragOffset]);

    // ScrollTrigger : activeSection + caméra
    useEffect(() => {
        const triggers: ScrollTrigger[] = [];

        sections.forEach((section) => {
            const el = sectionRefs.current[section.id];
            if (!el) return;

            const trigger = ScrollTrigger.create({
                trigger: el,
                start: 'top center',
                end: 'bottom center',
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
                    className="absolute top-16 right-8 p-3 z-[9999] rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20 "
                    data-cursor="pointer"
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

            </div>
            {/* Canvas plein écran derrière l'UI */}
            <div
                ref={canvasContainerRef}
                className={`fixed transition-all duration-1000 ease-in-out z-0 overflow-hidden top-0 right-0 w-1/2 h-full rounded-none cursor-grab active:cursor-grabbing`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
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
                            dragOffset={dragOffset}
                            dragAccumulated={dragAccumulated}
                            onAutoRotate={(rotation) => {
                                autoRotationAccumulatedRef.current = rotation;
                            }}
                            isPopZoomed={isPopZoomed}
                            isMiniaturized={isMiniaturized}
                            isDragging={isDraggingRef.current}
                        />
                        <IslandScene
                            isPopZoomed={isPopZoomed}
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

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 flex items-center justify-between`}>
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
                        className="px-4 py-2 rounded-full border border-white/20 text-sm font-semibold hover:border-white/60 transition-colors "
                        data-cursor="pointer"
                    >
                        {lang === 'fr' ? (
                            <span className="flex items-center gap-2">
                                <img src="/flags/France.svg" alt="French" className="w-5 h-5 inline-block" />
                                FR
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <img src="/flags/GB.svg" alt="English" className="w-5 h-5 inline-block" />
                                EN
                            </span>
                        )}
                    </button>
                    <button
                        className="px-4 py-2 rounded-full border border-white/20 text-sm font-semibold hover:border-white/60 transition-colors "

                        type="button"
                        onClick={() => setShowContact(true)}>
                        {t.contact}
                    </button>
                    <button
                        type="button"
                        onClick={onEnter3DMode}
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-semibold tracking-[0.2em] "
                        data-cursor="pointer"
                    >
                        {t.mode3d}
                    </button>
                </div>
            </header>

            {/* UI Standard - Fade out */}
            <div className={`transition-opacity duration-500 ${isPopZoomed ? 'opacity-0 ' : 'opacity-100'}`}>

                {/* Effets de fond + HUD */}


                {/* Stepper latéral */}
                <SectionNavigation
                    sections={sections}
                    activeId={activeSection}
                    onSelect={handleNavigation}
                />

                {/* Contenu texte (sections 100vh) */}
                <main className="relative z-20 space-y-0 background-none w-1/2">

                    {/* POPCLEM */}
                    <section
                        id="popclem"
                        ref={(node) => registerSection('popclem', node as HTMLElement)}
                        className="h-screen flex items-center w-full px-6 md:px-12"
                    >
                        <div className="flex flex-col items-start justify-end h-full w-full px-8 pb-12 gap-12 relative">
                            <p className="text-2xl md:text-3xl font-mono text-left leading-snug relative max-w-full">
                                <GlitchText
                                    text={lang === 'fr'
                                        ? "Bonjour, je m'appelle Clément. Je conçois et développe des produits numériques concrets, pensés pour être utilisés en conditions réelles.\n\nDu site web à l’application métier, j’interviens sur l’ensemble du cycle produit : compréhension du besoin, conception technique, développement et mise en production.\n\nMon objectif est simple : créer des solutions fiables, performantes et durables, qui répondent à de vrais enjeux métier et apportent une valeur mesurable."
                                        : "Hello, my name is Clément. I design and build concrete digital products, made to be used in real-world conditions.\n\nFrom websites to business applications, I work across the entire product lifecycle: understanding the need, technical design, development, and production deployment.\n\nMy goal is simple: to create reliable, performant, and sustainable solutions that address real business challenges and deliver measurable value."
                                    }
                                />
                            </p>

                            <div className="w-full flex justify-center">
                                <TechCarousel />
                            </div>

                            <div className="absolute bottom-[8px] left-[50dvw] -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce pointer-events-none">
                                <span className="text-[10px] text-center uppercase tracking-[0.2em]">{lang === 'fr' ? 'Découvrez mes projets' : 'Discover my projects'}</span>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </div>
                        </div>
                    </section>

                    {/* HÔPITAL */}
                    <section
                        id="hospital"
                        ref={(node) => registerSection('hospital', node as HTMLElement)}
                        className="h-screen flex items-center w-full px-6 md:px-12"
                    >
                        <div className="flex flex-col items-center justify-center h-full w-full px-8 gap-6 relative">
                            <div className="grid md:grid-cols-2 gap-8 w-full">
                                <div
                                    className="grid grid-rows-2 gap-4"
                                >
                                    <Carousel className='w-full h-[200px] drop-shadow-[0_0px_2px_rgba(255,255,255,0.4)]' images={["/images/medchem/main.webp", "/images/medchem/quiz.webp", "/images/medchem/backoffice.webp"]} />
                                    <div className='grid grid-cols-3 gap-4'>
                                        <div className="w-full rounded-lg flex flex-col items-center justify-center gap-2">
                                            <div
                                                className="text-[80px] leading-[0.9] text-center font-bold text-transparent drop-shadow-[0_0px_12px_rgba(255,0,255,1)]"
                                                style={{ WebkitTextStroke: "3px purple" }}
                                            >
                                                3
                                            </div>
                                            <div className="text-[20px] leading-none text-center font-semibold text-white drop-shadow-[0_0px_12px_rgba(255,0,255,1)]">
                                                mois
                                            </div>
                                        </div>

                                        <div className="w-full rounded-lg flex flex-col items-center justify-center gap-3 pt-3">
                                            <div
                                                className="text-[40px] leading-[0.9] text-center font-bold text-transparent drop-shadow-[0_0px_12px_rgba(0,255,255,1)]"
                                                style={{ WebkitTextStroke: "1px cyan" }}
                                            >
                                                Role :
                                            </div>
                                            <div className="text-[20px] leading-none text-center font-semibold text-white drop-shadow-[0_0px_12px_rgba(0,255,255,1)]">
                                                Lead Developer
                                            </div>
                                        </div>
                                        <div className="w-full rounded-lg flex flex-col items-center justify-center gap-1 pt-5">
                                            <div
                                                className="text-[10px] leading-[1] text-center font-semibold text-white drop-shadow-[0_0px_12px_rgba(255,255,255,1)]"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" className="stroke-white size-6 mx-auto w-10 h-10">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                </svg>
                                                Private Github
                                            </div>
                                            <a href="https://www.medchemstructuregenius.eu/" target="_blank" rel="noopener noreferrer" className="drop-shadow-[0_0px_12px_rgba(255,255,255,1)] group relative inline-flex h-9 hover:bg-violet-800 transition duration-300 ease-in-out items-center justify-center rounded-md bg-transparent border border-white px-2 font-medium text-neutral-200" data-cursor="pointer"><div className="relative h-5 w-5 overflow-hidden"><div className="absolute transition-all duration-200 group-hover:-translate-y-5 group-hover:translate-x-4"><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"><path d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -translate-x-4"><path d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg></div></div></a>
                                        </div>
                                    </div>
                                </div>
                                <ProjectDetailsPanel project={"hospital-project"} className='w-full h-[400px]' />
                            </div>
                            <GlitchText text={t.hospital.description} />
                        </div>
                    </section>

                    {/* MAISON + PELLETEUSE */}
                    <section
                        id="house"
                        ref={(node) => registerSection('house', node as HTMLElement)}
                        className="h-screen flex items-center w-full px-6 md:px-12"
                    >
                        <div className="flex flex-col items-center justify-center h-full w-full px-8 gap-6 relative">
                            <div className="grid md:grid-cols-2 gap-8 w-full">
                                <div
                                    className="grid grid-rows-2 gap-4"
                                >
                                    <Carousel className='w-full h-[200px] drop-shadow-[0_0px_2px_rgba(255,255,255,0.4)]' images={["/images/egs/client.png", "/images/egs/chantier.png", "/images/egs/devis.png", "/images/egs/factures.png", "/images/egs/technique.png", "/images/egs/confidentiel.png"]} />
                                    <div className='grid grid-cols-3 gap-4'>
                                        <div className="w-full rounded-lg flex flex-col items-center justify-center gap-2">
                                            <div
                                                className="text-[80px] leading-[0.9] text-center font-bold text-transparent drop-shadow-[0_0px_12px_rgba(255,0,255,1)]"
                                                style={{ WebkitTextStroke: "3px purple" }}
                                            >
                                                11
                                            </div>
                                            <div className="text-[20px] leading-none text-center font-semibold text-white drop-shadow-[0_0px_12px_rgba(255,0,255,1)]">
                                                mois
                                            </div>
                                        </div>

                                        <div className="w-full rounded-lg flex flex-col items-center justify-center gap-3 pt-3">
                                            <div
                                                className="text-[40px] leading-[0.9] text-center font-bold text-transparent drop-shadow-[0_0px_12px_rgba(0,255,255,1)]"
                                                style={{ WebkitTextStroke: "1px cyan" }}
                                            >
                                                Role :
                                            </div>
                                            <div className="text-[20px] leading-none text-center font-semibold text-white drop-shadow-[0_0px_12px_rgba(0,255,255,1)]">
                                                Fullstack Engineer
                                            </div>
                                        </div>
                                        <div className="w-full rounded-lg flex flex-col items-center justify-center gap-1 pt-5">
                                            <div
                                                className="text-[10px] leading-[1] text-center font-semibold text-white drop-shadow-[0_0px_12px_rgba(255,255,255,1)]"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" className="stroke-white size-6 mx-auto w-10 h-10">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                </svg>
                                                Private
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ProjectDetailsPanel project={"SAAS-ERP-EGS"} className='w-full h-[350px]' />
                            </div>
                            <GlitchText text={t.house.description} />
                        </div>
                    </section>
                </main>

                <footer className="relative z-10 px-6 md:px-12 -mt-10 pb-10 text-white/50 text-sm uppercase tracking-[0.4em]">
                    {t.footer}
                </footer>


                <Preloader isVisible={isPreloaderVisible} />



            </div>
            {showContact && <ContactModal onClose={() => setShowContact(false)} />}
        </div>
    );
};

export default NewHomePage;
