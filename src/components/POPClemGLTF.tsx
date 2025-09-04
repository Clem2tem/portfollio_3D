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
const POPClemGLTF: React.FC<Props> = ({ position = [0, 0, 0], scale = 0.4, maxSpeed = 0.2 }) => {
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
  // whether salut animation is currently playing
  const salutPlaying = useRef(false)

  const BLEND = 0.35
  const MOVE_THRESHOLD = 0.004 // tune sensitivity
  const MOVE_IDLE_TIMEOUT = 300 // ms
  const ANGLE_EPS = 0.01 // radians threshold to consider angle reached
  const IDLE_CONFIRM_MS = 150 // require this much time after movement stops before switching to Idle
  const TWO_PI = Math.PI * 2
  const idleConfirm = useRef<number | null>(null)
  

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
  // do not interrupt Salut once started (except when explicitly asking for Salut)
  if (salutPlaying.current && name.toLowerCase() !== 'salut') return

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
    salutPlaying.current = false
    if (movingRef.current) fadeTo('Walk')
    else fadeTo('Idle')
    }

    mixer.addEventListener('finished', onFinished)

  // Start salut (play once)
  salutPlaying.current = true
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
  const FOLLOW_RADIUS = 4.8
  const FOLLOW_HEIGHT = 0.1 

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
      // cancel any pending idle confirmation when movement resumes
      idleConfirm.current = null
    } else {
      if (movingRef.current && now - lastMoveTime.current > MOVE_IDLE_TIMEOUT) {
        movingRef.current = false
        // start idle confirmation timer
        idleConfirm.current = now
      }
    }

  // While Salut is playing, keep the model completely still (no position/rotation updates).
  // We still update cameraUnwrapped above for continuity, but exit early to avoid movement.
  if (salutPlaying.current) return

  // target position is the point on the circle at `angle` and FOLLOW_RADIUS (used implicitly below)

  // current model position (world)
    const currentWorld = new THREE.Vector3()
    if (group.current) group.current.getWorldPosition(currentWorld)
  // ARC FOLLOWING: move along the circle (angle) instead of cutting across
  // Compute current radius on XZ plane
  const currentRadius = Math.sqrt(currentWorld.x * currentWorld.x + currentWorld.z * currentWorld.z)

  // initialize modelAngle from current world orientation once
    if (modelAngle.current === null) {
      const init = Math.atan2(currentWorld.z, currentWorld.x)
      // adjust initial modelAngle to the nearest equivalent to the camera's unwrapped angle
      // so the model starts with a continuous (unwrapped) angle and won't jump on first frames
      let adjusted = init
      if (cameraUnwrapped.current !== null) {
        const n = Math.round((cameraUnwrapped.current - init) / TWO_PI)
        adjusted = init + n * TWO_PI
      }
      modelAngle.current = adjusted
    }

  // target angle (continuous, unwrapped)
  const targetAngle = cameraUnwrapped.current as number
  // current model angle (continuous)
  const curModelAngle = modelAngle.current as number

  // compute nearest equivalent of targetAngle (add multiples of 2PI) so we always take the short way
  const n = Math.round((curModelAngle - targetAngle) / TWO_PI)
  const targetNearest = targetAngle + n * TWO_PI
  // signed angular difference (already the shortest path)
  const deltaAngle = targetNearest - curModelAngle

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

  // facing logic moved below so it can use `reached` / idleConfirmed

    // determine whether we've reached the target angle (modulo-aware)
    // normalize difference to [-PI, PI]
    let remaining = ((targetNearest - newAngle + Math.PI) % (TWO_PI)) - Math.PI
    remaining = ((remaining + Math.PI) % (TWO_PI)) - Math.PI
    const reached = Math.abs(remaining) < ANGLE_EPS

    // compute facing direction now that we know if we're 'reached' (idle) or still moving
    if (group.current) {
      const rotLerp = Math.min(1, 8 * delta)
      const curYaw = group.current.rotation.y || 0

      let targetYaw: number

      // If Salut is playing or we've reached target and confirmed idle, face the camera
      const idleConfirmed = idleConfirm.current !== null && (performance.now() - (idleConfirm.current as number) >= IDLE_CONFIRM_MS)
      if (salutPlaying.current || (reached && idleConfirmed)) {
        // model world position
        const modelWorld = new THREE.Vector3()
        group.current.getWorldPosition(modelWorld)
        const toCam = new THREE.Vector3().subVectors(cam.position, modelWorld)
        targetYaw = Math.atan2(toCam.x, toCam.z)
      } else {
        // face tangent direction while moving (preserve previous dirSign logic)
        const tangent = new THREE.Vector3(-Math.sin(newAngle), 0, Math.cos(newAngle))
        const dirSign = Math.sign(angularStep) || Math.sign(deltaAngle) || 1
        tangent.multiplyScalar(dirSign)
        targetYaw = Math.atan2(tangent.x, tangent.z)
      }

      let yawDelta = targetYaw - curYaw
      yawDelta = ((yawDelta + Math.PI) % (2 * Math.PI)) - Math.PI
      const newYaw = curYaw + yawDelta * rotLerp
      let normYaw = ((newYaw + Math.PI) % (TWO_PI)) - Math.PI
      normYaw = ((normYaw + Math.PI) % (TWO_PI)) - Math.PI
      group.current.rotation.y = normYaw
    }

    // animation decision (centralized):
    // - if model hasn't reached the angular target -> Walk
    // - else if model reached target and camera has been idle for IDLE_CONFIRM_MS -> Idle
    // - otherwise keep Walk until confirmed
  const now2 = performance.now()
  const idleConfirmed = idleConfirm.current !== null && (now2 - (idleConfirm.current as number) >= IDLE_CONFIRM_MS)
  if (!reached) {
      // still moving toward target
      fadeTo('Walk')
    } else if (idleConfirmed) {
      fadeTo('Idle')
    } else {
      // reached but not yet confirmed idle -> stay in Walk for smoothness
      fadeTo('Walk')
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
