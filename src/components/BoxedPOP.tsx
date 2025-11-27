import { forwardRef, useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

type Vec3 = [number, number, number]

interface HouseProps {
    position?: Vec3
    rotation?: Vec3
    scale?: number | Vec3
    playAnimation?: boolean
    playReverse?: boolean
    onPointerOver?: (e: ThreeEvent<PointerEvent>) => void
    onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
    onClick?: (e: ThreeEvent<MouseEvent>) => void
}

const POPBoxed = forwardRef<THREE.Group, HouseProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            playAnimation = false,
            playReverse = false,
            onPointerOver,
            onPointerOut,
            onClick
        },
        ref
    ) => {

        const { scene, animations } = useGLTF('models/POPBOXED/POPBoxed.glb')

        const mixerRef = useRef<THREE.AnimationMixer | null>(null)
        const actionRef = useRef<THREE.AnimationAction | null>(null)

        // 🔥 Initialisation du mixer + animation
        useEffect(() => {
            if (!scene || animations.length < 2) return

            mixerRef.current = new THREE.AnimationMixer(scene)

            // Sélection de l'animation 1 (celle qui fonctionnait)
            const clip = animations[1]
            actionRef.current = mixerRef.current.clipAction(clip)

            actionRef.current.loop = THREE.LoopOnce
            actionRef.current.clampWhenFinished = true

        }, [scene, animations])

        // 🔥 Jouer ou inverser l’animation
        // 🔥 Jouer ou inverser l’animation correctement
        useEffect(() => {
            if (!actionRef.current) return
            const action = actionRef.current
            const duration = action.getClip().duration

            if (playAnimation) {
                // Animation normale
                action.paused = false
                action.timeScale = 1
                action.setLoop(THREE.LoopOnce, 1)
                action.clampWhenFinished = true

                // IMPORTANT : commencer au début
                action.time = 0
                action.play()

            } else if (playReverse) {
                // Animation en reverse
                action.paused = false
                action.timeScale = -1
                action.setLoop(THREE.LoopOnce, 1)
                action.clampWhenFinished = true

                // IMPORTANT : commencer à la fin
                action.time = duration
                action.play()
            }
        }, [playAnimation, playReverse])


        // 🔥 Animation loop
        useEffect(() => {
            if (!mixerRef.current) return

            let prev = performance.now()
            let frame: number

            const loop = () => {
                const now = performance.now()
                const delta = (now - prev) / 1000
                prev = now

                mixerRef.current!.update(delta)
                frame = requestAnimationFrame(loop)
            }

            frame = requestAnimationFrame(loop)

            return () => cancelAnimationFrame(frame)
        }, [])

        // Tagging de la scène
        useEffect(() => {
            if (!scene) return
            try {
                scene.name ||= 'POPBoxed'
                scene.userData = {
                    ...(scene.userData || {}),
                    collisionName: 'POPBoxed',
                    animated: true
                }
            } catch (_) { }
        }, [scene])

        if (!scene) return null

        return (
            <primitive
                ref={ref}
                object={scene}
                scale={scale}
                position={position}
                rotation={rotation}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                    console.log('BoxedPOP.tsx: onPointerOver fired', e);
                    if (onPointerOver) onPointerOver(e);
                }}
                onPointerOut={onPointerOut}
                onClick={onClick}
            />
        )
    }
)

export default POPBoxed
