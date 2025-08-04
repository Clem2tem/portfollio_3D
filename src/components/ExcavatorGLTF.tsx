
import {useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three';
import { useFrame} from '@react-three/fiber';
import React from 'react';
import SVGLogo3D from './SVGLogo3D';


// Composant persistant pour l'excavator animé
const ExcavatorGLTF: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const gltf = useGLTF('models/Excavator/Excavator.gltf');
    const anims = useAnimations(gltf.animations, gltf.scene);
    const mixerRef = React.useRef<any>(null);
    const actionsRef = React.useRef<any>(null);
    const lastLoopTimeRef = React.useRef(0);
    const pauseBetweenLoopsRef = React.useRef(false);
    const eventListenerAddedRef = React.useRef(false);

    React.useEffect(() => {
        if (!anims || !gltf || !anims.actions || Object.keys(anims.actions).length === 0) return;
        if (!mixerRef.current) mixerRef.current = anims.mixer;
        if (!actionsRef.current) actionsRef.current = anims.actions;
        if (!eventListenerAddedRef.current && mixerRef.current) {
            mixerRef.current.addEventListener('finished', () => {
                pauseBetweenLoopsRef.current = true;
                lastLoopTimeRef.current = Date.now();
            });
            eventListenerAddedRef.current = true;
        }
        // Lance l'animation si aucune n'est en cours (au tout premier montage)
        const actions = anims.actions;
        let anyPlaying = false;
        Object.values(actions).forEach((action: any) => {
            if (action.isRunning()) anyPlaying = true;
        });
        if (!anyPlaying && !pauseBetweenLoopsRef.current) {
            Object.values(actions).forEach((action: any) => {
                action.reset();
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
                action.play();
            });
        }
    }, [anims, gltf]);

    useFrame((_, delta) => {
        if (mixerRef.current) {
            if (pauseBetweenLoopsRef.current) {
                const now = Date.now();
                const pauseDuration = 1000;
                if (now - lastLoopTimeRef.current >= pauseDuration) {
                    Object.values(actionsRef.current || {}).forEach((action: any) => {
                        action.reset();
                        action.play();
                    });
                    pauseBetweenLoopsRef.current = false;
                }
            } else {
                mixerRef.current.update(delta * 0.2);
            }
        }
    });

    React.useEffect(() => {
        // Patch matériaux pour cohérence visuelle et ombres (une seule fois)
        if (!gltf) return;
        gltf.scene.traverse((child: any) => {
            if (child.isMesh) {
                const originalMaterial = child.material;
                const newMaterial = new THREE.MeshStandardMaterial({
                    map: originalMaterial?.map || null,
                    normalMap: originalMaterial?.normalMap || null,
                    color: originalMaterial?.color || new THREE.Color('#a0a0a0'),
                    metalness: 0.1,
                    roughness: 0.8,
                    emissive: new THREE.Color('#000000'),
                    emissiveIntensity: 0
                });
                child.material = newMaterial;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [gltf]);

    if (!gltf) return null;
    // Calculer la rotation pour que l'excavator regarde le centre (0,0,0)
    const excavatorRef = React.useRef<THREE.Object3D>(null);
    const rotationInitialised = React.useRef(false);
    useFrame(() => {
        if (excavatorRef.current && !rotationInitialised.current) {
            excavatorRef.current.rotateX(THREE.MathUtils.degToRad(-5));
            excavatorRef.current.rotateZ(THREE.MathUtils.degToRad(-3));
            excavatorRef.current.rotateY(THREE.MathUtils.degToRad(-20));
            rotationInitialised.current = true; // éviter de réinitialiser à chaque frame
        }
    });
    const logoTexture = new THREE.TextureLoader().load('/logos/EGS.svg');
    logoTexture.anisotropy = 8;
    const logoRef = React.useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (logoRef.current) {
            // Flottement vertical
            const t = state.clock.getElapsedTime();
            logoRef.current.position.y = 0.8 + Math.sin(t * 2) * 0.05;
            // Rotation
            logoRef.current.rotation.y = t * 0.8;
        }
    });



    return (
        <group>
            <primitive
                ref={excavatorRef}
                object={gltf.scene}
                scale={[0.2, 0.2, 0.2]}
                position={position}
            />
            {/* Logo SVG 3D extrudé avec scale adapté */}
            <SVGLogo3D
                url={"/logos/EGS.svg"}
                position={[position[0] - 0.15, position[1], position[2] - 0.1]}
                scale={0.0010}
                onClick={() => window.open('https://egs.fr', '_blank')}
                private={true}
            />
        </group>
    );
};

export default ExcavatorGLTF;