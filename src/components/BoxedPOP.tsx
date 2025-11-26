import { forwardRef, useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

type Vec3 = [number, number, number]

interface HouseProps {
    position?: Vec3
    rotation?: Vec3
    scale?: number | Vec3

    /** Pour déclencher l'animation */
    playAnimation?: boolean
}

const POPBoxed = forwardRef<THREE.Group, HouseProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            playAnimation = false
        },
        ref
    ) => {

        const { scene, animations } = useGLTF('models/POPBOXED/POPBoxed.glb')

        // Mixer pour gérer l’animation
        const mixerRef = useRef<THREE.AnimationMixer | null>(null)
        const actionRef = useRef<THREE.AnimationAction | null>(null)

        /** Initialisation de l’animation */
        useEffect(() => {
            if (!scene) return

            // Création du mixer
            mixerRef.current = new THREE.AnimationMixer(scene)

            // On suppose qu'il n’y a qu’une seule animation dans le glb (celle du couvercle)
            if (animations && animations.length > 0) {
                actionRef.current = mixerRef.current.clipAction(animations[1])
                actionRef.current.clampWhenFinished = true
                actionRef.current.loop = THREE.LoopOnce
            }

        }, [scene, animations])

        /** Jouer ou arrêter l’animation selon playAnimation */
        useEffect(() => {
            if (!actionRef.current) return

            if (playAnimation) {
                actionRef.current.reset().play()
            }
        }, [playAnimation])

        /** Rafraîchir le mixer à chaque frame */
        useEffect(() => {
            if (!mixerRef.current) return

            let prevTime = performance.now()
            let animationFrameId: number

            const animate = () => {
                const currentTime = performance.now()
                const delta = (currentTime - prevTime) / 1000
                prevTime = currentTime

                mixerRef.current!.update(delta)
                animationFrameId = requestAnimationFrame(animate)
            }

            animationFrameId = requestAnimationFrame(animate)

            return () => {
                cancelAnimationFrame(animationFrameId)
            }
        }, [])

        useEffect(() => {
            console.log('Animations:', animations);
        }, [animations]);

        /** Tagging de la scène */
        useEffect(() => {
            try {
                if (scene) {
                    if (!scene.name) scene.name = 'POPBoxed'
                    scene.userData = {
                        ...(scene.userData || {}),
                        collisionName: 'POPBoxed',
                        animated: true
                    }
                }
            } catch (e) { }
        }, [scene])

        if (!scene) return null

        return (
            <primitive
                ref={ref}
                object={scene}
                scale={scale}
                position={position}
                rotation={rotation}
            />
        )
    }
)

export default POPBoxed
