import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Island from './Island'
import ProjectBuildings from './ProjectBuildings'
import Portal from './Portal'
import POPClemGLTF from './POPClemGLTF'
import { usePlayerPosition } from '../contexts/PlayerPositionContext'
import Desk from './Desk'
import Room from './Room'

interface SceneProps {
  isNightMode: boolean
  isEntering?: boolean
  onAnimationComplete?: () => void
}

const Scene: React.FC<SceneProps> = ({ isNightMode, onAnimationComplete }) => {
  const sceneRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.SpotLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)
  // Day directional lights (3-point): key, fill, rim
  const dirKeyRef = useRef<THREE.DirectionalLight>(null)
  const dirFillRef = useRef<THREE.DirectionalLight>(null)
  const dirRimRef = useRef<THREE.DirectionalLight>(null)
  const dirTargetRef = useRef<THREE.Object3D>(null)
  // const controlsRef = useRef<any>(null)
  const { gl, camera } = useThree()
  // Toggle third-person player control for POPClem (true => camera is driven behind the player)
  const PLAYER_CONTROLLED = true

  // Keep player camera defaults here so Scene and POPClemGLTF stay in sync
  // Use a close, slightly elevated default so the camera starts near the player on scene load.
  // Matches the requested default: distance 0.5, slightly above.
  const PLAYER_CAM_DISTANCE = 0.5
  const PLAYER_CAM_HEIGHT = 0.8

  // Animation de caméra
  const [animationState, setAnimationState] = useState<{
    isAnimating: boolean
    startTime: number
    startPosition: THREE.Vector3
    endPosition: THREE.Vector3
  } | null>(null)

  // Fonction easing
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  // Ensure camera starts slightly above and behind the player instead of using Canvas default
  useEffect(() => {
    try {
      // place camera behind and slightly above the player using the player camera defaults
      camera.position.set(0, PLAYER_CAM_HEIGHT, PLAYER_CAM_DISTANCE)
      camera.lookAt(0, 0, 0)
    } catch (e) {
      // ignore if three not ready
    }
  }, [camera])

  const playerPos = usePlayerPosition().position
  // Keep last valid player position to avoid jumps to origin when playerPos is briefly undefined/zero
  const lastValidPlayerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))


  // Empêcher le comportement de drag du canvas
  useEffect(() => {
    const canvas = gl.domElement

    // Désactiver le drag and drop sur le canvas
    canvas.ondragstart = () => false
    canvas.onselectstart = () => false
    canvas.oncontextmenu = (e) => e.preventDefault()

    // Empêcher la sélection du canvas
    canvas.style.userSelect = 'none'
    canvas.style.webkitUserSelect = 'none'
      ; (canvas.style as any).mozUserSelect = 'none'
      ; (canvas.style as any).msUserSelect = 'none'

    return () => {
      canvas.ondragstart = null
      canvas.onselectstart = null
      canvas.oncontextmenu = null
    }
  }, [gl])

  // Synchronize spotlight position with camera + animation de caméra
  // small helper to smoothly apply an externally-requested lookAt (set by ProjectBuildings)
  const requestedLookAtRef = useRef<THREE.Vector3 | null>(null)
  const lookAtExpireRef = useRef<number | null>(null)
  // Smoothing speed for light movement (higher = snappier)
  const LIGHT_SMOOTH_SPEED = 8
  useFrame((_, delta) => {
    // If an external lookAt was requested via window.__requestedCameraLookAt, pick it up and expire after a short time
    const req = (window as any).__requestedCameraLookAt as { x: number; y: number; z: number } | undefined
    if (req) {
      requestedLookAtRef.current = new THREE.Vector3(req.x, req.y, req.z)
      lookAtExpireRef.current = Date.now() + 3000 // keep focus for 3s by default
      // remove the global request so it won't be re-read repeatedly
      try { delete (window as any).__requestedCameraLookAt } catch (e) { }
    }
    // if we have an active requested lookAt, move camera to frame it smoothly
    const nowMs = Date.now()
    if (requestedLookAtRef.current && lookAtExpireRef.current && nowMs < lookAtExpireRef.current) {
      const target = requestedLookAtRef.current
      // desired camera offset relative to the target so the building and player are visible near center/top
      const desiredCam = new THREE.Vector3(target.x + 0.6, target.y + PLAYER_CAM_HEIGHT, target.z + PLAYER_CAM_DISTANCE * 0.6)
      camera.position.lerp(desiredCam, 0.08)
      camera.lookAt(target)
      // continue with rest of frame logic (lighting update) below
    } else if (lookAtExpireRef.current && nowMs >= (lookAtExpireRef.current || 0)) {
      // expired: clear refs so normal camera behavior resumes
      requestedLookAtRef.current = null
      lookAtExpireRef.current = null
    }

    // Gérer l'animation de caméra
    if (animationState?.isAnimating) {
      const elapsed = Date.now() - animationState.startTime
      const duration = 3000 // 3 secondes
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      // Interpoler la position
      const currentPos = animationState.startPosition.clone().lerp(
        animationState.endPosition,
        easedProgress
      )
      camera.position.copy(currentPos)
      camera.lookAt(0, 0, 0)

      // Fin de l'animation
      if (progress >= 1) {
        setAnimationState(null)
        if (onAnimationComplete) {
          onAnimationComplete()
        }
      }
    }

  if (lightRef.current && targetRef.current) {
      // Distance fixe du centre (0,0,0)z
      const fixedHeight = 3 // hauteur fixe pour la lumière
      // Use the player's position when available; otherwise fallback to last known valid position
      let px = lastValidPlayerPosRef.current.x
      let pz = lastValidPlayerPosRef.current.z
      if (playerPos && typeof playerPos.x === 'number' && typeof playerPos.z === 'number') {
        px = playerPos.x
        pz = playerPos.z
        // update last valid (keep Y from player if provided)
        lastValidPlayerPosRef.current.set(px, typeof playerPos.y === 'number' ? playerPos.y : lastValidPlayerPosRef.current.y, pz)
      }
  const lightPos = new THREE.Vector3(px, fixedHeight, pz)
  // Use delta-aware lerp for smooth movement
  const alpha = 1 - Math.exp(-LIGHT_SMOOTH_SPEED * delta)
  lightRef.current.position.lerp(lightPos, alpha)

  // La cible est verticalement sous la lumière (suivra en lissé)
  const targetPos = lightPos.clone()
  targetPos.y = 2 // cible à hauteur fixe sous la lumière
  targetRef.current.position.lerp(targetPos, alpha)
  // ensure the spotLight targets the object3D (object reference can remain constant)
  lightRef.current.target = targetRef.current
    }
    // Update day directional lights (3-point) so key follows camera angle (sun-like)
    if (dirKeyRef.current && dirTargetRef.current && camera) {
      const camPos = camera.position.clone()
      const radius = 4.5
      // key light higher to emulate sun elevation
      const keyHeight = 10
      const angle = Math.atan2(camPos.z, camPos.x)
      const keyPos = new THREE.Vector3(Math.cos(angle) * radius, keyHeight, Math.sin(angle) * radius)
      dirKeyRef.current.position.copy(keyPos)
      // target the scene center
      dirTargetRef.current.position.set(0, 2, 0)
      dirKeyRef.current.target = dirTargetRef.current

      // Fill light: opposite side, low intensity, no shadows
      if (dirFillRef.current) {
        const fillPos = new THREE.Vector3(Math.cos(angle + Math.PI) * radius * 0.6, 3, Math.sin(angle + Math.PI) * radius * 0.6)
        dirFillRef.current.position.copy(fillPos)
        dirFillRef.current.target = dirTargetRef.current
      }

      // Rim light: offset perpendicular to key to create separation
      if (dirRimRef.current) {
        const rimPos = new THREE.Vector3(Math.cos(angle + Math.PI / 2) * radius * 0.8, 6, Math.sin(angle + Math.PI / 2) * radius * 0.8)
        dirRimRef.current.position.copy(rimPos)
        dirRimRef.current.target = dirTargetRef.current
      }
    }
  })

  return (
    <>

      {/* Éclairage de base adaptatif */}
      <ambientLight intensity={isNightMode ? 0.1 : 0.4} color={isNightMode ? "#FFFFFF" : "#87CEEB"} />
      {isNightMode && (
        <>
          {/* Lumière spot qui suit la caméra et forme un cône */}
          <spotLight
            ref={lightRef}
            intensity={isNightMode ? 8 : 12}
            color={isNightMode ? "#ffffff" : "#FFF8DC"}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={15}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
            angle={Math.PI / 4} // Angle du cône de lumière
            penumbra={1} // Douceur des bords
            distance={20}
            decay={2}
            position={[0, 0, 0]} // Position initiale, sera synchronisée avec la caméra
          />
          {/* Objet cible invisible pour la lumière spot */}
          <object3D ref={targetRef} />
        </>
      )}

      {/* Lumière directionnelle pour simuler le soleil en mode jour */}
      {!isNightMode && (
        <>
          {/* Key light (sun-like) - visible and casts shadows */}
          <directionalLight
            ref={dirKeyRef}
            intensity={1}
            color="#FFF8DC"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={20}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />

          {/* Fill light - subtle, no shadows */}
          <directionalLight
            ref={dirFillRef}
            intensity={0.35}
            color="#FFF8DC"
            castShadow={false}
          />

          {/* Rim light - subtle separation, no shadows */}
          <directionalLight
            ref={dirRimRef}
            intensity={0.25}
            color="#FFEFD5"
            castShadow={false}
          />

          {/* Invisible target for directional lights to look at */}
          <object3D ref={dirTargetRef} />
        </>
      )}
      <group ref={sceneRef}>
        {/* L'île principale */}
        <Island />

        {/* Les bâtiments représentant les projets */}
      </group>
      <ProjectBuildings isNightMode={isNightMode} />

      <Desk />
      <Room />

      {/* {isNightMode && <StarField count={1200} radius={180} color="#fff" size={8} /> ||
        <Sky
          sunPosition={[100, 100, 100]}
          distance={450000}
          turbidity={10}
          rayleigh={0.2} // Baisse la luminosité du ciel
          mieCoefficient={0.005} // Optionnel : réduit l'éblouissement
          mieDirectionalG={0.7} // Optionnel : rend la lumière plus douce
        />
      } */}

      <Portal />

      {/* Océan infini adaptatif */}
      {/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          color={isNightMode ? "#050510" : "#1E90FF"}
          transparent
          opacity={isNightMode ? 0.9 : 0.7}
          roughness={0.8}
          metalness={0.0}
        />
      </mesh> */}

      <POPClemGLTF
        position={[0, 1.2, 0]}
        scale={0.02}
        playerControlled={PLAYER_CONTROLLED}
        moveSpeed={2.2}
        cameraDistance={PLAYER_CAM_DISTANCE}
        cameraHeight={PLAYER_CAM_HEIGHT}
        showHitboxes={false}
      />

      {/* Fog pour l'atmosphère adaptatif */}
      {/* <fog attach="fog" args={[isNightMode ? '#000005' : '#87CEEB', 8, 25]} /> */}

      {/* Lumière ponctuelle violette seulement en mode nuit */}
      <pointLight
        position={[0, 2, 0]}
        intensity={4.5}
        color="#8844ff"
      />
    </>
  )
}

export default Scene
