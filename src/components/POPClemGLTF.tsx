import React, { useRef, useEffect, useState, MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { PLAYER_RADIUS, usePrecisePlayerPhysics } from '../hooks/usePrecisePlayerPhysics'
import { HitboxVisualizer } from './HitboxVisualizer'
import { usePlayerPosition } from '../contexts/PlayerPositionContext'

type Props = {
  position?: [number, number, number]
  scale?: number
  maxSpeed?: number // units per second
  playerControlled?: boolean
  moveSpeed?: number // units per second when player controlled
  cameraDistance?: number
  cameraHeight?: number
  showHitboxes?: boolean // Pour afficher ou masquer les hitboxes
}

/**
 * POPClemGLTF
 * - Loads the model at /POP/POP Clem 2.gltf
 * - Plays 'Idle' by default
 * - Plays 'Walk' while the camera is moving horizontally around the center
 * - Plays 'Jump' when jumping (new animation to be added)
 * - Plays 'Salut' once when clicked, then returns to Walk/Idle
 * - Uses smooth crossfades between animations
 * - Includes physics system with gravity, jumping and collision detection
 */
const POPClemGLTF: React.FC<Props> = ({
  position = [0, 0, 0],
  scale = 0.05,
  maxSpeed = 0.6,
  playerControlled = false,
  moveSpeed = 2,
  cameraDistance = 0.5,
  cameraHeight = 1,
  showHitboxes = false
}) => {
  const group = useRef<THREE.Group | null>(null)
  // prefer unencoded path and encode once so bundler/browser can find it reliably
  const gltf = useGLTF('models/POP/POPClem2.glb')
  const { actions, mixer } = useAnimations((gltf && gltf.animations) || [], group as MutableRefObject<THREE.Object3D | null>)

  // Initialize physics system with precise GLTF collision detection
  const { updatePhysics, initializeCollisions, collisionObjects } = usePrecisePlayerPhysics()

  // États pour le visualiseur de hitboxes
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(...position))
  const [showHitboxesState, setShowHitboxesState] = useState(showHitboxes)
  const [hitboxFilter, setHitboxFilter] = useState<'all' | 'island' | 'others'>('all')

  // Player position persistence API (context)
  const playerPosApi = usePlayerPosition()

  // React to external focus/position requests (e.g. when clicking a building)
  useEffect(() => {
    const req = playerPosApi.position
    if (!req || !group.current) return
    try {
      // Smoothly move the player to the requested position over a short period.
      const target = new THREE.Vector3(req.x, req.y, req.z)
      // if parented, convert to local
      if (group.current.parent) {
        const inv = new THREE.Matrix4().copy(group.current.parent.matrixWorld).invert()
        target.applyMatrix4(inv)
      }
      // immediate set to avoid physics fight; leave physics to reconcile next frames
      group.current.position.lerp(target, 1)
      // if a lookAt is provided, set the camera to face it briefly by storing to a custom flag on window
      if (req.lookAt) {
        try {
          // small helper: set a global requested camera lookAt so Scene/POPClem can pick it up if needed
          ; (window as any).__requestedCameraLookAt = { x: req.lookAt.x, y: req.lookAt.y ?? 0, z: req.lookAt.z }
        } catch (e) { }
      }
    } catch (e) {
      // ignore
    }
    // clear the request after applying once
    playerPosApi.clearPosition()
  }, [playerPosApi.position])

  // Écouter les touches H/J pour basculer l'affichage et filtrer
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'KeyH') {
        setShowHitboxesState(prev => !prev)
        console.log('Hitboxes:', showHitboxesState ? 'désactivées' : 'activées')
      } else if (event.code === 'KeyJ') {
        setHitboxFilter(prev => prev === 'all' ? 'island' : prev === 'island' ? 'others' : 'all')
        // eslint-disable-next-line no-console
        console.log('[Hitboxes] Filtre:', hitboxFilter === 'all' ? 'island' : hitboxFilter === 'island' ? 'others' : 'all')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showHitboxesState, hitboxFilter])

  const scene = gltf?.scene

  // compute a model-based eye offset so the camera pivots at a natural height
  // relative to the character instead of an arbitrary magic number.
  const modelEyeOffsetRef = useRef<number | null>(null)
  useEffect(() => {
    if (!scene) return
    try {
      // ensure world matrices are up-to-date
      scene.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(scene)
      const height = box.max.y - box.min.y
      // pick a point a bit above the model bottom (tweak the 0.75 factor if needed)
      const eyeLocal = box.min.y + height * scale * 0.75
      // account for the group's scale prop
      const eyeWorld = eyeLocal
      modelEyeOffsetRef.current = Math.max(0, eyeWorld)
      // eslint-disable-next-line no-console
      console.log('[POPClemGLTF] computed model eye offset', modelEyeOffsetRef.current)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[POPClemGLTF] failed to compute model bbox for camera pivot', e)
      modelEyeOffsetRef.current = Math.max(0, cameraHeight * 0.2)
    }
  }, [scene, scale, cameraHeight])

  // Initialize player position
  useEffect(() => {
    // Apply initial position once on mount. If a saved position exists in context, restore it
    try {
      const saved = playerPosApi.position
      if (group.current) {
        if (saved) {
          group.current.position.set(saved.x, saved.y, saved.z)
        } else {
          group.current.position.fromArray(position)
        }
      }
    } catch (e) {
      // fallback: just set from props
      if (group.current) group.current.position.fromArray(position)
    }
    // run only on mount
  }, [])

  // Persist player position on unmount so remounts can restore it
  useEffect(() => {
    return () => {
      try {
        if (group.current) {
          const p = new THREE.Vector3()
          group.current.getWorldPosition(p)
          playerPosApi.setPosition({ x: p.x, y: p.y, z: p.z })
        }
      } catch (e) {
        // ignore
      }
    }
  }, [])

  // DEBUG: periodic publisher to ensure PlayerPositionContext receives updates
  useEffect(() => {
    let id: number | null = null
    try {
      id = window.setInterval(() => {
        if (!group.current) return
        try {
          const p = new THREE.Vector3()
          group.current.getWorldPosition(p)
          // send without spamming if identical
          const prev = lastSentPos.current
          if (!prev || prev.distanceTo(p) > 0.001) {
            lastSentPos.current = p.clone()
            playerPosApi.setPosition({ x: p.x, y: p.y, z: p.z })
          }
        } catch (e) {}
      }, 200)
    } catch (e) {}
    return () => { if (id) window.clearInterval(id) }
  }, [])

  // Initialize collisions with real GLTF objects from the scene
  useEffect(() => {
    if (!playerControlled) return

    // Wait for GLTF models to load, then get their references
    const timer = setTimeout(() => {
      try {
        const gltfObjects: Array<{ object3D: THREE.Object3D; name: string; animated?: boolean }> = []

        // Chercher spécifiquement les refs des composants GLTF chargés
        if (group.current && group.current.parent) {
          const scene = group.current.parent

          console.log('Analyse de la scène pour les objets GLTF...')

          // helper: detect if this node should be considered animated
          const detectAnimated = (node: THREE.Object3D) => {
            // explicit flag on userData still honoured
            if ((node as any).userData?.animated) return true
            // if any descendant is a SkinnedMesh, treat as animated
            let hasSkinned = false
            node.traverse((n) => { if ((n as any).isSkinnedMesh) hasSkinned = true })
            if (hasSkinned) return true
            // check gltf animations for tracks that target this node by name
            if (gltf?.animations && gltf.animations.length > 0) {
              const nodeName = node.name || ''
              for (const clip of gltf.animations) {
                const tracks = (clip as any).tracks || []
                for (const t of tracks) {
                  if (typeof t.name === 'string' && nodeName && (t.name.startsWith(nodeName + '.') || t.name.includes('/' + nodeName + '.'))) return true
                }
              }
            }
            return false
          }

          scene.traverse((child) => {
            // Chercher l'île / hôpital / excavator - prioriser userData.collisionName et le nom du node
            // tout en conservant les heuristiques de position en fallback (ne pas les supprimer).
            if (child.type === 'Group' && child.children.length > 0) {
              const worldPos = new THREE.Vector3()
              child.getWorldPosition(worldPos)

              const ud = (child as any).userData || {}

              // compute once: does this node contain any Mesh children?
              let hasMeshes = false
              child.traverse((subChild) => { if (subChild.type === 'Mesh') hasMeshes = true })
              if (!hasMeshes) return

              if (ud && ud.collisionName) {
                const name = String(ud.collisionName)
                if (!gltfObjects.find(obj => obj.name === name)) {
                  gltfObjects.push({ object3D: child, name, animated: ud.animated ?? detectAnimated(child) })
                  console.log(`${name} trouvé via userData.collisionName à la position:`, worldPos, 'taille:', child.children.length)
                  return
                }
              }
            }
          })
        }

        if (gltfObjects.length > 0) {
          initializeCollisions(gltfObjects)
          console.log(`Collisions initialisées avec ${gltfObjects.map(obj => obj.name).join(', ')}`)
        } else {
          console.warn('Aucun objet GLTF principal trouvé pour les collisions')
          console.log('Tentative de recherche alternative...')

          // Alternative: chercher par nom ou propriétés spécifiques
          scene.traverse((child) => {
            if (child.userData && Object.keys(child.userData).length > 0) {
              console.log('Objet avec userData trouvé:', child.name, child.userData, child.position)
            }
          })
        }

      } catch (error) {
        console.error('Erreur lors de la recherche des objets GLTF:', error)
      }
    }, 2000) // Attendre 2 secondes pour que les modèles se chargent

    return () => clearTimeout(timer)
  }, [playerControlled, initializeCollisions])

  // state to track current action name
  const [current, setCurrent] = useState<string | null>(null)

  // track camera angle to detect horizontal movement
  const lastMoveTime = useRef<number>(0)
  const movingRef = useRef(false)
  const moveAccum = useRef(0)
  // player input state
  const keys = useRef<Record<string, boolean>>({})
  // mouse drag for camera control
  const dragging = useRef(false)
  const lastMouseX = useRef(0)
  const lastMouseY = useRef(0)
  const camYawOffset = useRef(0) // radians added to player yaw
  const camPitch = useRef(0.15) // initial pitch (radians), positive => camera slightly above the pivot
  // camera distance ref so wheel can update it
  const cameraDistanceRef = useRef(cameraDistance)
  // raycaster for camera occlusion checks (prevent camera being behind geometry)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  // camera distance limits (ajuste ici pour rapprocher/éloigner la caméra)
  const MIN_CAM_DIST = 0.5
  const MAX_CAM_DIST = 4
  // ensure initial is clamped
  cameraDistanceRef.current = Math.max(MIN_CAM_DIST, Math.min(MAX_CAM_DIST, cameraDistanceRef.current))
  const stopCounter = useRef(0)
  // remember last position we pushed to context to avoid emission every frame
  const lastSentPos = useRef<THREE.Vector3 | null>(null)
  // keep an unwrapped camera angle so full rotations (±n * 2PI) are tracked
  const cameraUnwrapped = useRef<number | null>(null)
  const prevWrapped = useRef<number | null>(null)
  // track the model's continuous angle on the circle
  const modelAngle = useRef<number | null>(null)
  // whether salut animation is currently playing
  const salutPlaying = useRef(false)

  const BLEND = 0.35
  const MOVE_THRESHOLD = 0.004 // tune sensitivity
  const MIN_START_ANGLE = (60 * Math.PI) / 180 // 60 degrees in radians
  const MOVE_IDLE_TIMEOUT = 300 // ms
  const STOP_FRAMES = 8 // require this many stable frames before considering stop
  const ANGLE_EPS = 0.01 // radians threshold to consider angle reached
  const IDLE_CONFIRM_MS = 150 // require this much time after movement stops before switching to Idle
  const TWO_PI = Math.PI * 2
  // animation speed multipliers (keys case-insensitive)
  const ACTION_SPEEDS: Record<string, number> = {
    walk: 2,
    salut: 1.6,
    jump: 1.8, // New animation speed for jumping
  }
  const idleConfirm = useRef<number | null>(null)

  // register keyboard handlers only in playerControlled mode
  useEffect(() => {
    if (!playerControlled) return
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    // mouse handlers for camera rotation while holding click
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      dragging.current = true
      lastMouseX.current = e.clientX
      lastMouseY.current = e.clientY
    }
    const onMouseUp = (_e: MouseEvent) => {
      dragging.current = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastMouseX.current
      const dy = e.clientY - lastMouseY.current
      lastMouseX.current = e.clientX
      lastMouseY.current = e.clientY
      // sensitivity tuning
      const SENS = 0.005
      camYawOffset.current -= dx * SENS
      // invert vertical drag: moving mouse up should increase elevation
      camPitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, camPitch.current + dy * SENS))
    }
    // wheel to zoom camera distance (attach to canvas when possible)
    const onWheel: EventListener = (evt) => {
      const e = evt as WheelEvent
      // deltaY: positive -> wheel down -> zoom out
      const ZS = 0.005
      const prev = cameraDistanceRef.current
      cameraDistanceRef.current = Math.max(MIN_CAM_DIST, Math.min(MAX_CAM_DIST, cameraDistanceRef.current + e.deltaY * ZS))
      if (prev !== cameraDistanceRef.current) {
        // small debug visible in console when zoom changes
        // eslint-disable-next-line no-console
        console.log('[camera] distance ->', cameraDistanceRef.current)
      }
      // prevent page scroll when adjusting
      e.preventDefault()
    }
    const canvas = document.querySelector('canvas')
    const wheelTarget: EventTarget = canvas ?? window
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    wheelTarget.addEventListener('wheel', onWheel, { passive: false } as AddEventListenerOptions)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      wheelTarget.removeEventListener('wheel', onWheel as any)
    }
  }, [playerControlled])


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

    // apply speed multiplier if configured for this action key
    try {
      const speed = ACTION_SPEEDS[key.toLowerCase()] ?? 1
      // set timeScale (safe even if action not started yet)
      next.timeScale = speed
    } catch (e) {
      // ignore if action doesn't support timeScale
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
        try { mixer.stopAllAction() } catch (e) { }
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
      } catch (e) { }
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
  const FOLLOW_HEIGHT = 0.1

  useFrame((state, delta) => {
    if (!state.camera) return
    const cam = state.camera
    // authoritative camera distance (set by mouse wheel / user)
    const r = cameraDistanceRef.current

    // player-controlled movement: WASD or ZQSD (Z/Q on AZERTY) + Space for jump
    if (playerControlled && group.current) {
      const forward = (keys.current['KeyW'] || keys.current['KeyZ']) ? 1 : 0
      const back = keys.current['KeyS'] ? 1 : 0
      const left = (keys.current['KeyA'] || keys.current['KeyQ']) ? 1 : 0
      const right = keys.current['KeyD'] ? 1 : 0
      const jump = keys.current['Space'] ? true : false

      const moveX = right - left
      const moveZ = forward - back

      // Build movement vector relative to the camera orientation
      const camForward = new THREE.Vector3()
      cam.getWorldDirection(camForward)
      camForward.y = 0
      if (camForward.lengthSq() > 1e-6) camForward.normalize()

      // Right vector relative to camera; negate to match expected left/right input mapping
      const camRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), camForward).normalize().negate()

      const inputVector = new THREE.Vector3()
      inputVector.addScaledVector(camForward, moveZ * moveSpeed)
      inputVector.addScaledVector(camRight, moveX * moveSpeed)

      // Update physics
      const currentPosition = new THREE.Vector3()
      if (group.current.parent) {
        group.current.getWorldPosition(currentPosition)
      } else {
        currentPosition.copy(group.current.position)
      }

      const newPosition = updatePhysics(currentPosition, delta, inputVector, jump)

      // Apply physics position to the model
      if (group.current.parent) {
        const inv = new THREE.Matrix4().copy(group.current.parent.matrixWorld).invert()
        const local = newPosition.clone().applyMatrix4(inv)
        group.current.position.copy(local)
      } else {
        group.current.position.copy(newPosition)
      }

      // Mettre à jour la position pour le visualiseur de hitboxes
      setPlayerPosition(newPosition.clone())

      // Rotate player to face movement direction if moving horizontally
      if (inputVector.x !== 0 || inputVector.z !== 0) {
        const desiredYaw = Math.atan2(inputVector.x, inputVector.z)
        const curYaw = group.current.rotation.y || 0
        let yawDelta = desiredYaw - curYaw
        yawDelta = ((yawDelta + Math.PI) % (2 * Math.PI)) - Math.PI
        const rotLerp = Math.min(1, 10 * delta)
        group.current.rotation.y = curYaw + yawDelta * rotLerp
      }

      // Animation logic based on movement and input
      if (jump) {
        // Try to play Jump animation if available, otherwise fall back to Walk
        const jumpAction = getAction('Jump') || getAction('jump')
        if (jumpAction) {
          fadeTo('Jump')
        } else {
          fadeTo('Walk') // Fallback if no jump animation
        }
      } else if (inputVector.lengthSq() > 0.01) {
        fadeTo('Walk')
      } else {
        fadeTo('Idle')
      }

      // camera follow behind the player
      const camTarget = new THREE.Vector3()
      group.current.getWorldPosition(camTarget)

      // apply camera yaw/pitch offsets from mouse drag
      const totalYaw = camYawOffset.current

      // when playerControlled, slightly lower the camera pitch to appear closer to the model
      const pitchAdjust = playerControlled ? -0.12 : 0
      const elevation = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camPitch.current + pitchAdjust))
      const dir = new THREE.Vector3(
        -Math.sin(totalYaw) * Math.cos(elevation),
        Math.sin(elevation),
        -Math.cos(totalYaw) * Math.cos(elevation)
      ).normalize()
      const pivot = camTarget.clone()
      const computedEye = modelEyeOffsetRef.current ?? Math.max(0.0, cameraHeight * 0.2)
      pivot.y += computedEye

      // position = pivot + dir * r (zoom only changes distance r)
      const camPos = pivot.clone().add(dir.clone().multiplyScalar(r))

      // Occlusion handling: if something is between pivot (player) and desired camPos,
      // move the camera forward to sit just in front of the obstacle, otherwise use camPos.
      try {
        const raycaster = raycasterRef.current
        const dirToCam = camPos.clone().sub(pivot).normalize()
        raycaster.set(pivot, dirToCam)
        raycaster.far = r

        // intersect the whole scene; filter to Meshes and ignore the player group
        const hits = raycaster.intersectObjects(state.scene.children, true).filter(i => i.object.type === 'Mesh')

        const isDescendantOf = (node: THREE.Object3D | null, ancestor: THREE.Object3D | null) => {
          let n: THREE.Object3D | null = node
          while (n) {
            if (n === ancestor) return true
            n = n.parent
          }
          return false
        }

        // find the first hit that isn't part of the player group
        let validHit: THREE.Intersection | null = null
        for (const h of hits) {
          if (!group.current) { validHit = h; break }
          if (!isDescendantOf(h.object, group.current)) { validHit = h; break }
        }

        if (validHit) {
          // place the camera slightly in front of the hit point to avoid clipping
          // Allow the camera to come closer than the normal MIN_CAM_DIST when occluded.
          const EPS = 0.15
          const OCCLUSION_MIN_DIST = 0.15 // how close the camera may get when pushing through occluders
          let safeDist = (validHit.distance || 0) - EPS
          // clamp to a small occlusion min distance to avoid camera collapsing into the player
          safeDist = Math.max(OCCLUSION_MIN_DIST, safeDist)
          // also don't exceed the intended radius r
          safeDist = Math.min(r, safeDist)
          const collisionCamPos = pivot.clone().add(dirToCam.clone().multiplyScalar(safeDist))
          cam.position.lerp(collisionCamPos, Math.min(1, 12 * delta))
        } else {
          // no obstruction -> normal follow
          cam.position.lerp(camPos, Math.min(1, 8 * delta))
        }
      } catch (e) {
        // on any raycast error, fall back to normal behaviour
        cam.position.lerp(camPos, Math.min(1, 8 * delta))
      }

      cam.lookAt(pivot)

      return
    }

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
      // accumulate absolute rotation to require a deliberate turn before starting Walk
      moveAccum.current += absd
      // reset stable stop counter while camera is actively moving
      stopCounter.current = 0
      // when accumulated rotation exceeds MIN_START_ANGLE we mark as moving
      if (!movingRef.current && moveAccum.current >= MIN_START_ANGLE) {
        movingRef.current = true
        // cancel any pending idle confirmation when movement resumes
        idleConfirm.current = null
        lastMoveTime.current = now
      }
      // if already moving, update lastMoveTime
      if (movingRef.current) lastMoveTime.current = now
    } else {
      // small/no rotation this frame
      // if we're not moving yet, decay accumulation slowly so tiny shakes don't persist
      if (!movingRef.current) {
        moveAccum.current = Math.max(0, moveAccum.current - Math.min(moveAccum.current, 0.01))
      }
      // increment stable-frame counter; once it reaches STOP_FRAMES we consider the camera stopped
      stopCounter.current = (stopCounter.current ?? 0) + 1
      if (stopCounter.current >= STOP_FRAMES) {
        if (movingRef.current && now - lastMoveTime.current > MOVE_IDLE_TIMEOUT) {
          movingRef.current = false
          // start idle confirmation timer
          idleConfirm.current = now
          // reset accumulator
          moveAccum.current = 0
        }
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
    // use the authoritative user radius 'r' as the follow radius so zoom is preserved
    const desiredFollowRadius = r
    // convert to max angular step based on desiredFollowRadius (arc length = radius * angle)
    const maxAngularStep = desiredFollowRadius > 0 ? maxStep / desiredFollowRadius : Math.sign(deltaAngle) * Math.abs(deltaAngle)

    // apply angular step (preserve direction) but based on modelAngle (continuous)
    const angularStep = Math.abs(deltaAngle) > Math.abs(maxAngularStep) ? Math.sign(deltaAngle) * Math.abs(maxAngularStep) : deltaAngle
    const newAngle = curModelAngle + angularStep
    // store updated continuous model angle
    modelAngle.current = newAngle

    // gently correct radial distance towards the desiredFollowRadius while respecting maxStep
    const radiusDiff = desiredFollowRadius - currentRadius
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
    <>
      {/* Do not pass `position` as a prop here to avoid external re-renders resetting the
          programmatically-updated position; initial pos already set on mount above. */}
      <group ref={group} scale={[scale, scale, scale]} onClick={onClick} dispose={null}>
        <primitive object={scene} />
      </group>

      {/* Visualiseur de hitboxes - placé en dehors du groupe du joueur */}
      <HitboxVisualizer
        visible={showHitboxesState}
        playerPosition={playerPosition}
        playerRadius={PLAYER_RADIUS}
        colliders={collisionObjects}
        filterMode={hitboxFilter}
      />
    </>
  )
}

useGLTF.preload('models/POP/POPClem2.glb')
export default POPClemGLTF
