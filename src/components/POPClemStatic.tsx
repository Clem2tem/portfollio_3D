import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'


const POPClemStatic: React.FC = () => {
    const group = useRef<THREE.Group | null>(null)
    const gltf = useGLTF('models/POP/POPClem2.glb')
    const { actions, mixer } = useAnimations((gltf && gltf.animations) || [], group as any)
    const salutPlayedRef = useRef(false)
    const salutPlaying = useRef(false)

    const getIdleAction = () => {
        if (!actions) return undefined
        const key = Object.keys(actions).find(k => k.toLowerCase() === 'idle')
        return key ? actions[key] : undefined
    }

    const getSalutAction = () => {
        if (!actions) return undefined
        const key = Object.keys(actions).find(k => k.toLowerCase() === 'salut')
        return key ? actions[key] : undefined
    }

    const playSalutOnce = () => {
        if (!actions) return
        if (salutPlaying.current) return
        if (salutPlayedRef.current) return
        salutPlayedRef.current = true
        const salut = getSalutAction()
        if (!salut) return

        // If we don't have a mixer for some reason, just play the action
        if (!mixer) {
            salutPlaying.current = true
            salut.reset()
            salut.setLoop(THREE.LoopOnce, 1)
            salut.clampWhenFinished = true
            salut.timeScale = 1
            salut.play()
            return
        }

        salutPlaying.current = true

        // Attempt to stop/fade Idle to avoid mixing poses
        try {
            const idle = getIdleAction()
            if (idle) {
                try { idle.fadeOut(0.12) } catch (e) {}
                // ensure idle is stopped shortly after fade out
                try { window.setTimeout(() => { try { idle.stop() } catch (e) {} }, 200) } catch (e) {}
            }
        } catch (e) {}

        salut.reset()
        salut.setLoop(THREE.LoopOnce, 1)
        salut.clampWhenFinished = true
        salut.timeScale = 1
        salut.play()

        // Listen for the mixer's finished event and clear the flag when this action finishes
        const onFinished = (e: any) => {
            if (e.action === salut) {
                salutPlaying.current = false
                try { mixer.removeEventListener('finished', onFinished) } catch (e) {}
                // Make sure idle restarts after salut
                try { playIdle() } catch (e) {}
            }
        }
        try { mixer.addEventListener('finished', onFinished) } catch (e) {}
    }

    // removed auto-play of Salut on load; Salut will be triggered by camera arrival or click

    const playIdle = () => {
        if (!actions) return
        if (salutPlaying.current) return
        const idle = getIdleAction()
        if (!idle) return
        try {
            idle.reset()
            idle.setLoop(THREE.LoopRepeat, Infinity)
            idle.clampWhenFinished = false
            idle.timeScale = 1
            idle.play()
        } catch (e) {
            // ignore
        }
    }


    // Start idle automatically when animations are ready
    useEffect(() => {
        if (!actions) return
        try {
            playIdle()
        } catch (e) {}
    }, [actions])

    // Increase perceived brightness of the model textures/materials in a non-invasive way.
    // This adjusts texture encoding (sRGB) and adds a subtle emissive based on the base color so
    // the character appears brighter without changing global scene lighting.
    useEffect(() => {
        if (!gltf || !gltf.scene) return
        const BRIGHTNESS_MULT = 1.25 // tune this value (1.0 = no change)

        const enhanceMaterial = (mat: any) => {
            if (!mat) return
            if (Array.isArray(mat)) {
                mat.forEach(enhanceMaterial)
                return
            }

            try {
                // Ensure texture maps use sRGB for correct color brightness
                if (mat.map) {
                    try {
                        ;(mat.map as any).encoding = (THREE as any).sRGBEncoding || (THREE as any).LinearSRGBColorSpace || 3001
                        mat.map.needsUpdate = true
                    } catch (e) {}
                }
                if (mat.emissive === undefined) mat.emissive = new THREE.Color(0x000000)

                // If material has a base color, use it to create a subtle emissive highlight
                if (mat.color && mat.color.isColor) {
                    const boosted = mat.color.clone().multiplyScalar(BRIGHTNESS_MULT)
                    // clamp values to valid range
                    boosted.r = Math.min(1, boosted.r)
                    boosted.g = Math.min(1, boosted.g)
                    boosted.b = Math.min(1, boosted.b)
                    mat.emissive.copy(boosted)
                    // keep emissiveIntensity modest to avoid a glow effect
                    mat.emissiveIntensity = 0.02
                } else {
                    // fallback small emissive boost
                    mat.emissive.setScalar(0.02)
                    mat.emissiveIntensity = 0.02
                }
                mat.needsUpdate = true
            } catch (e) {
                // ignore errors modifying exotic materials
            }
        }

        gltf.scene.traverse((child: any) => {
            if (child.isMesh) {
                enhanceMaterial(child.material)
                // keep nice shadows
                child.castShadow = true
                child.receiveShadow = true
            }
        })
    }, [gltf])

    // Listen for camera arrival events and trigger salut when camera targets popclem
    useEffect(() => {
        const handler = (ev: Event) => {
            try {
                const detail = (ev as CustomEvent).detail || {}
                const id = detail.id
                const from = detail.from
                // Only salut when arriving specifically to popclem AND we came from another item
                if (id === 'popclem') {
                    // if `from` is missing (initial camera placement) or same as target, ignore
                    if (!from || from === 'popclem') {
                        return
                    }
                    playSalutOnce()
                }
            } catch (e) {}
        }
        window.addEventListener('cameraArrived', handler as EventListener)
        return () => window.removeEventListener('cameraArrived', handler as EventListener)
    }, [actions, mixer])

    return (
        <group ref={group} position={[-1, 0, 1]} scale={[0.05, 0.05, 0.05]} onClick={(e) => { e.stopPropagation(); playSalutOnce() }} dispose={null}>
            <primitive object={gltf.scene} rotation={[0, Math.PI / 3, 0]} />
        </group>
    )
}

useGLTF.preload('models/POP/POPClem2.glb')
export default POPClemStatic
