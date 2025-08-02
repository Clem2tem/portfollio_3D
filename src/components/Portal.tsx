


import React, { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shader pour alpha radial animé
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform sampler2D uTexture;

  void main() {
    vec2 center = vec2(0.52, 0.5); // X, Y
    float scale = 1.2; // ajuste ce chiffre pour zoomer/dézoomer
    vec2 uv = (vUv - center) / scale;
    float angle = uTime * 0.5;
    float r = length(uv);
    float theta = atan(uv.y, uv.x);
    // Appliquer la rotation globale
    float cosA = cos(angle);
    float sinA = sin(angle);
    mat2 rot = mat2(cosA, -sinA, sinA, cosA);
    vec2 uvRot = rot * uv + center;
    // Alpha contour
    float edge = smoothstep(0.28 + 0.04*sin(uTime*2.0), 0.54, r);
    float alpha = 1.0 - edge;
    // Optionnel : pulsation du contour
    alpha *= 0.8 + 0.2 * sin(uTime*2.0 + r*8.0);
    vec4 tex = texture2D(uTexture, uvRot);
    // Appliquer l'effet spiralé sur la luminosité
    vec3 color = tex.rgb;
    gl_FragColor = vec4(color, tex.a * alpha);
  }
`;

const Portal: React.FC = () => {
    const { scene, animations } = useGLTF('models/Portal/Portal.gltf') as any;
    const { scene: structureScene } = useGLTF('models/Portal_Structure/Portal_Structure.gltf') as any;
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);

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
                // Appliquer le shader uniquement au mesh du portail (pas la structure)
                if (child.material && child.material.map) {
                    const shaderMat = new THREE.ShaderMaterial({
                        uniforms: {
                            uTime: { value: 0 },
                            uTexture: { value: child.material.map }
                        },
                        vertexShader,
                        fragmentShader,
                        transparent: true,
                        side: THREE.DoubleSide
                    });
                    child.material = shaderMat;
                }
            }
        });
        // Animation GLTF : jouer toutes les animations exportées
        if (animations && animations.length > 0) {
            mixerRef.current = new THREE.AnimationMixer(scene);
            animations.forEach((clip: THREE.AnimationClip) => {
                mixerRef.current!.clipAction(clip).play();
            });
        }
        return () => {
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current.uncacheRoot(scene);
                mixerRef.current = null;
            }
        };
    }, [scene, animations]);

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
        // Avancer l'animation GLTF
        if (mixerRef.current) {
            mixerRef.current.update(delta);
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
