


import React, { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shader pour alpha radial animé avec displacement
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  
  // Fonction de noise pour le displacement
  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  void main() {
    vUv = uv;
    vNormal = normal;
    
    vec3 pos = position;
    vec2 center = vec2(0.5, 0.5);
    vec2 uvCentered = uv - center;
    float r = length(uvCentered);
    float angle = atan(uvCentered.y, uvCentered.x);
    
    // Vagues rondes concentriques
    float wave1 = sin(r * 20.0 + uTime * 3.0) * 0.05;
    float wave2 = sin(r * 35.0 - uTime * 2.5) * 0.03;
    float wave3 = sin(angle * 8.0 + uTime * 4.0) * 0.02;
    
    // Atténuation vers les bords pour un effet plus naturel
    float falloff = smoothstep(0.5, 0.0, r);
    float displacement = (wave1 + wave2 + wave3) * falloff;
    
    // Appliquer le displacement le long de la normale
    pos += normal * displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;

  // Fonction de noise simple
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = vUv - center;
    float r = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Rotation globale
    float rotAngle = uTime * 2.3;
    mat2 rot = mat2(cos(rotAngle), -sin(rotAngle), sin(rotAngle), cos(rotAngle));
    vec2 rotUV = rot * uv;
    
    // Effet spirale
    float spiral = sin(angle * 8.0 + r * 15.0 - uTime * 4.0) * 0.5 + 0.5;
    float spiral2 = sin(angle * 12.0 - r * 20.0 + uTime * 3.0) * 0.5 + 0.5;
    
    // Noise animé
    float n1 = noise(rotUV * 4.0 + vec2(uTime * 0.5, -uTime * 0.3));
    float n2 = noise(rotUV * 8.0 - vec2(uTime * 0.7, uTime * 0.4));
    
    // Mélange des effets
    float intensity = mix(spiral, spiral2, 0.5 + 0.5 * sin(uTime));
    intensity = mix(intensity, n1, 0.3);
    intensity += n2 * 0.2;
    
    // Couleurs magiques (dégradé violet/bleu/blanc)
    vec3 color1 = vec3(0.4, 0.1, 0.8);  // violet foncé
    vec3 color2 = vec3(0.3, 0.1, 0.8);  // bleu clair
    vec3 color3 = vec3(0.4, 0.1, 0.6);  // blanc rosé

    vec3 finalColor;
    if (intensity < 0.4) {
      finalColor = mix(color1, color2, intensity / 0.4);
    } else {
      finalColor = mix(color1, color3, (intensity - 0.4) / 0.6);
    }
    
    // Effet de brillance au centre
    float centerGlow = 1.0 - smoothstep(0.0, 0.3, r);
    finalColor += centerGlow * vec3(0.8, 0.6, 1.0) * 0.5;
    
    // Alpha contour doux et animé
    float edge = smoothstep(0.35 + 0.05 * sin(uTime * 3.0), 0.5, r);
    float alpha = (1.0 - edge) * (0.7 + 0.3 * sin(uTime * 2.0 + r * 10.0));
    
    // Masque circulaire strict
    if (r > 0.5) alpha = 0.0;
    
    // Boost luminosité générale
    finalColor *= 1.5;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const Portal: React.FC = () => {
    const { scene, animations } = useGLTF('models/Portal/Portal.gltf') as any;
    const { scene: structureScene, animations: structureAnimations } = useGLTF('models/Portal_Structure/Portal_Structure.gltf') as any;
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const structureMixerRef = useRef<THREE.AnimationMixer | null>(null);

    // Optionnel : forcer les ombres sur tous les meshes

    // Référence pour stocker les meshes à animer
    const meshesRef = useRef<THREE.Mesh[]>([])

    useEffect(() => {
        meshesRef.current = [];
        scene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                meshesRef.current.push(child);
                // Toujours appliquer le shader (pas besoin de texture)
                const shaderMat = new THREE.ShaderMaterial({
                    uniforms: {
                        uTime: { value: 0 }
                    },
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                child.material = shaderMat;
            }
        });
        
        // Animation GLTF : jouer toutes les animations du portail
        if (animations && animations.length > 0) {
            mixerRef.current = new THREE.AnimationMixer(scene);
            animations.forEach((clip: THREE.AnimationClip) => {
                mixerRef.current!.clipAction(clip).play();
            });
        }

        // Animation GLTF : jouer toutes les animations de la structure
        if (structureAnimations && structureAnimations.length > 0) {
            structureMixerRef.current = new THREE.AnimationMixer(structureScene);
            structureAnimations.forEach((clip: THREE.AnimationClip) => {
                structureMixerRef.current!.clipAction(clip).play();
            });
        }

        return () => {
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current.uncacheRoot(scene);
                mixerRef.current = null;
            }
            if (structureMixerRef.current) {
                structureMixerRef.current.stopAllAction();
                structureMixerRef.current.uncacheRoot(structureScene);
                structureMixerRef.current = null;
            }
        };
    }, [scene, animations, structureScene, structureAnimations]);

    // Animation : rotation spirale + alpha contour
    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        meshesRef.current.forEach((mesh) => {
            // Animation : rotation de la texture (map) et alpha contour
            const mat = mesh.material as any;
            if (mat.uniforms) {
                mat.uniforms.uTime.value = time;
            }
        });
        // Avancer l'animation GLTF du portail
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
        // Avancer l'animation GLTF de la structure
        if (structureMixerRef.current) {
            structureMixerRef.current.update(delta);
        }
    });

    // S'assurer que le portail est rendu après la structure pour la transparence
    return (
        <group>
            <primitive object={structureScene} scale={[0.4, 0.4, 0.4]} position={[0, -0.5, 0]} />
            <primitive object={scene} scale={[0.4, 0.4, 0.4]} position={[0, -0.5, 0]} />
        </group>
    )
}

export default Portal
