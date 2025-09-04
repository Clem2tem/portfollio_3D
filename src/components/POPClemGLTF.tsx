import React, { useRef, useEffect, useState, MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

type Props = {
  position?: [number, number, number]
  scale?: number
  maxSpeed?: number // units per second
}

/**
 * POPClemGLTF
 * - Loads the model at /POP/POP Clem 2.gltf
 * - Plays 'Idle' by default
 * - Plays 'Walk' while the camera is moving horizontally around the center
 * - Plays 'Salut' once when clicked, then returns to Walk/Idle
 * - Uses smooth crossfades between animations
 */
const POPClemGLTF: React.FC<Props> = ({ position = [0, 0, 0], scale = 1, maxSpeed = 3 }) => {
  const group = useRef<THREE.Group | null>(null)
  // prefer unencoded path and encode once so bundler/browser can find it reliably
  const gltf = useGLTF('models/POP/POPClem2.glb')
  const { actions, mixer } = useAnimations((gltf && gltf.animations) || [], group as MutableRefObject<THREE.Object3D | null>)

  const scene = gltf?.scene

  // state to track current action name
  const [current, setCurrent] = useState<string | null>(null)

  // track camera angle to detect horizontal movement
  const lastMoveTime = useRef<number>(0)
  const movingRef = useRef(false)
  // keep an unwrapped camera angle so full rotations (±n * 2PI) are tracked
  const cameraUnwrapped = useRef<number | null>(null)
  const prevWrapped = useRef<number | null>(null)
  // track the model's continuous angle on the circle
  const modelAngle = useRef<number | null>(null)

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
    if (!actions || !mixer) return

    // resolve actual action key case-insensitively
    const key = Object.keys(actions).find(k => k.toLowerCase() === name.toLowerCase())
    if (!key) return
    const next = actions[key]
    if (!next) return
    // if already the current action (by key), do nothing
    if (current === key) return

    const prevKey = current ? Object.keys(actions).find(k => k.toLowerCase() === (current as string).toLowerCase()) : undefined
    const prev = prevKey ? actions[prevKey] : undefined

    // configure loop mode
    if (once) {
      next.reset()
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    } else {
      next.reset()
      next.setLoop(THREE.LoopRepeat, Infinity)
      next.clampWhenFinished = false
    }

    // play next then crossfade from prev if exists
    try {
      next.play()
      if (prev) {
        // ensure prev is playing for crossFade
        prev.play()
        prev.crossFadeTo(next, BLEND, false)
      } else {
        // no prev -> ensure a clean start
        try { mixer.stopAllAction() } catch (e) {}
        next.fadeIn(BLEND)
      }
      setCurrent(key)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[POPClemGLTF] fadeTo error', e)
    }
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
      // Try to start Idle via fadeTo (fallback to first available action)
      if (Object.keys(actions).length) {
        const idleKey = Object.keys(actions).find(k => k.toLowerCase() === 'idle')
        if (idleKey) fadeTo(idleKey)
        else fadeTo(Object.keys(actions)[0])
      }
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

  // camera movement detection + follow target derived from camera angle (same circle as Scene)
  // Scene places the light on a circle radius=4.5, height=3
  const FOLLOW_RADIUS = 4.5
  const FOLLOW_HEIGHT = 3

  useFrame((state, delta) => {
    if (!state.camera) return
    const cam = state.camera
    // match Scene.tsx: use atan2(z, x) for wrapped angle
    const wrapped = Math.atan2(cam.position.z, cam.position.x)

    // initialize unwrapped / prevWrapped on first frame
    let wrappedDelta = 0
    if (cameraUnwrapped.current === null) {
      cameraUnwrapped.current = wrapped
      prevWrapped.current = wrapped
    } else {
      // compute wrapped delta and normalize to -PI..PI
      wrappedDelta = wrapped - (prevWrapped.current as number)
      wrappedDelta = ((wrappedDelta + Math.PI) % (2 * Math.PI)) - Math.PI
      cameraUnwrapped.current = (cameraUnwrapped.current as number) + wrappedDelta
      prevWrapped.current = wrapped
    }

    // use the normalized per-frame wrappedDelta for movement detection (small value)
    const absd = Math.abs(wrappedDelta)

    const now = performance.now()
    if (absd > MOVE_THRESHOLD) {
      lastMoveTime.current = now
  if (!movingRef.current) movingRef.current = true
  // while movement is detected, ensure we're in Walk
  fadeTo('Walk')
    } else {
      if (movingRef.current && now - lastMoveTime.current > MOVE_IDLE_TIMEOUT) {
        movingRef.current = false
        fadeTo('Idle')
      }
    }

  // target position is the point on the circle at `angle` and FOLLOW_RADIUS (used implicitly below)

  // current model position (world)
    const currentWorld = new THREE.Vector3()
    if (group.current) group.current.getWorldPosition(currentWorld)
  // ARC FOLLOWING: move along the circle (angle) instead of cutting across
  // Compute current radius on XZ plane
  const currentRadius = Math.sqrt(currentWorld.x * currentWorld.x + currentWorld.z * currentWorld.z)

  // initialize modelAngle from current world orientation once
  if (modelAngle.current === null) modelAngle.current = Math.atan2(currentWorld.z, currentWorld.x)

  // target angle (continuous, unwrapped)
  const targetAngle = cameraUnwrapped.current as number
  // current model angle (continuous)
  const curModelAngle = modelAngle.current as number
  let deltaAngle = targetAngle - curModelAngle

    // linear max step this frame
    const maxStep = maxSpeed * Math.max(0.016, delta)
    // convert to max angular step based on circle radius (arc length = radius * angle)
  const maxAngularStep = FOLLOW_RADIUS > 0 ? maxStep / FOLLOW_RADIUS : Math.sign(deltaAngle) * Math.abs(deltaAngle)

  // apply angular step (preserve direction) but based on modelAngle (continuous)
  const angularStep = Math.abs(deltaAngle) > Math.abs(maxAngularStep) ? Math.sign(deltaAngle) * Math.abs(maxAngularStep) : deltaAngle
  const newAngle = curModelAngle + angularStep
  // store updated continuous model angle
  modelAngle.current = newAngle

    // gently correct radial distance towards FOLLOW_RADIUS while respecting maxStep
    const radiusDiff = FOLLOW_RADIUS - currentRadius
    const radialStep = Math.abs(radiusDiff) > maxStep ? Math.sign(radiusDiff) * maxStep : radiusDiff
    const newRadius = currentRadius + radialStep

    // compute new world position on the (possibly corrected) circle
    const newPosWorld = new THREE.Vector3(
      Math.cos(newAngle) * newRadius,
      FOLLOW_HEIGHT,
      Math.sin(newAngle) * newRadius
    )

    // compute facing direction (tangent) and smoothly rotate the model to face motion
    if (group.current) {
      // tangent vector for increasing angle
      const tangent = new THREE.Vector3(-Math.sin(newAngle), 0, Math.cos(newAngle))
      // direction sign: angular step sign indicates clockwise or counter-clockwise movement
      const dirSign = angularStep === 0 ? (deltaAngle >= 0 ? 1 : -1) : Math.sign(angularStep)
      tangent.multiplyScalar(dirSign)

      // target yaw so the model faces along the tangent (assuming model forward is +Z)
      const targetYaw = Math.atan2(tangent.x, tangent.z)

      // smooth rotation interpolation (handle angle wrap)
      const curYaw = group.current.rotation.y || 0
      let yawDelta = targetYaw - curYaw
      yawDelta = ((yawDelta + Math.PI) % (2 * Math.PI)) - Math.PI
      const rotLerp = Math.min(1, 8 * delta) // adjust 8 for rotation responsiveness
      const newYaw = curYaw + yawDelta * rotLerp
      group.current.rotation.y = newYaw
    }

    // convert world to parent-local and apply
    if (group.current && group.current.parent) {
      const parentInv = new THREE.Matrix4().copy(group.current.parent.matrixWorld).invert()
      const localPos = newPosWorld.clone().applyMatrix4(parentInv)
      group.current.position.copy(localPos)
    } else if (group.current) {
      group.current.position.copy(newPosWorld)
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
