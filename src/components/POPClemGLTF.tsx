import React, { useRef, useEffect, useState, MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

type Props = {
  position?: [number, number, number]
  scale?: number
}

/**
 * POPClemGLTF
 * - Loads the model at /POP/POP Clem 2.gltf
 * - Plays 'Idle' by default
 * - Plays 'Walk' while the camera is moving horizontally around the center
 * - Plays 'Salut' once when clicked, then returns to Walk/Idle
 * - Uses smooth crossfades between animations
 */
const POPClemGLTF: React.FC<Props> = ({ position = [0, 0, 0], scale = 1 }) => {
  const group = useRef<THREE.Group | null>(null)
  // prefer unencoded path and encode once so bundler/browser can find it reliably
  const gltf = useGLTF('models/POP/POPClem2.glb')
  const { actions, mixer } = useAnimations((gltf && gltf.animations) || [], group as MutableRefObject<THREE.Object3D | null>)

  const scene = gltf?.scene

  // state to track current action name
  const [current, setCurrent] = useState<string | null>(null)

  // track camera angle to detect horizontal movement
  const prevAngle = useRef<number | null>(null)
  const lastMoveTime = useRef<number>(0)
  const movingRef = useRef(false)

  const BLEND = 0.35
  const MOVE_THRESHOLD = 0.004 // tune sensitivity
  const MOVE_IDLE_TIMEOUT = 300 // ms

  // helper: find action by name case-insensitive
  const getAction = (name: string) => {
    if (!actions) return undefined
    if (actions[name]) return actions[name]
    const key = Object.keys(actions).find(k => k.toLowerCase() === name.toLowerCase())
    return key ? actions[key] : undefined
  }

  // Crossfade to an action (looping by default)
  const fadeTo = (name: string, once = false) => {
  const next = getAction(name)
  if (!next) return
  if (current === name) return

  const prev = current ? getAction(current) : undefined

  // Configurer le loop
  if (once) {
    next.reset()
    next.setLoop(THREE.LoopOnce, 1)
    next.clampWhenFinished = true
  } else {
    next.reset()
    next.setLoop(THREE.LoopRepeat, Infinity)
    next.clampWhenFinished = false
  }

  // 🔑 Astuce : play() d'abord, puis crossFade
  next.play()

  if (prev) {
    prev.crossFadeTo(next, BLEND, false)
  } else {
    next.fadeIn(BLEND)
  }

  setCurrent(name)
}


  // Play Salut once and return to appropriate state on finish
  const playSalutOnce = () => {
    const salut = getAction('Salut') || getAction('salut')
    if (!salut || !mixer) return

    // listen for finished on mixer
    const onFinished = (e: any) => {
      // only react when the finished action is salut
      if (e.action !== salut) return
      mixer.removeEventListener('finished', onFinished)
      // return to walk or idle
      if (movingRef.current) fadeTo('Walk')
      else fadeTo('Idle')
    }

    mixer.addEventListener('finished', onFinished)

  // Start salut (play once)
  fadeTo('Salut', true)
  }

  // init: play Idle when actions are ready
  useEffect(() => {
    if (!actions) return
    try {
      // prefer exact names, otherwise fallback heuristics
      if (getAction('Idle')) fadeTo('Idle')
      else if (getAction('idle')) fadeTo('idle')
      else if (Object.keys(actions).length) fadeTo(Object.keys(actions)[0])
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[POPClemGLTF] error while starting animation', err)
    }

    // cleanup on unmount
    return () => {
      try {
        mixer?.stopAllAction()
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  // click handler
  const onClick = (e: any) => {
    try {
      e.stopPropagation()
      playSalutOnce()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[POPClemGLTF] click handler error', err)
    }
  }

  // camera movement detection
  useFrame((state) => {
    if (!state.camera) return
    const cam = state.camera
    const angle = Math.atan2(cam.position.x, cam.position.z)
    if (prevAngle.current === null) prevAngle.current = angle
    let d = angle - prevAngle.current
    // normalize to -PI..PI
    d = ((d + Math.PI) % (2 * Math.PI)) - Math.PI
    const absd = Math.abs(d)
    prevAngle.current = angle

    const now = performance.now()
    if (absd > MOVE_THRESHOLD) {
      lastMoveTime.current = now
      if (!movingRef.current) {
        movingRef.current = true
        fadeTo('Walk')
      }
    } else {
      if (movingRef.current && now - lastMoveTime.current > MOVE_IDLE_TIMEOUT) {
        movingRef.current = false
        fadeTo('Idle')
      }
    }
  })

  // don't render until model is loaded
  if (!scene) return null

  return (
    <group ref={group} position={position} scale={[scale, scale, scale]} onClick={onClick} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('models/POP/POPClem2.glb')
export default POPClemGLTF
