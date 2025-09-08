import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const POPClemStatic: React.FC = () => {
    const group = useRef<THREE.Group | null>(null)
    const gltf = useGLTF('models/POP/POPClem2.glb')
    const { actions, mixer } = useAnimations((gltf && gltf.animations) || [], group as any)

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
        salut.reset()
        salut.setLoop(THREE.LoopOnce, 1)
        salut.clampWhenFinished = true
        salut.timeScale = 1
        salut.play()

        // Listen for the mixer's finished event and clear the flag when this action finishes
        const onFinished = (e: any) => {
            if (e.action === salut) {
                salutPlaying.current = false
                mixer.removeEventListener('finished', onFinished)
            }
        }
        mixer.addEventListener('finished', onFinished)
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

    // Listen for camera arrival events and trigger salut when camera targets popclem
    useEffect(() => {
        const handler = (ev: Event) => {
            try {
                const detail = (ev as CustomEvent).detail || {}
                const id = detail.id
                if (id === 'popclem') {
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
