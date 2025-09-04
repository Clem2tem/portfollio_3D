import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import StarField from './StarField'
import Island from './Island'
import ProjectBuildings from './ProjectBuildings'
import Portal from './Portal'
import POPClemGLTF from './POPClemGLTF'

interface SceneProps {
  isNightMode: boolean
  isEntering?: boolean
  onAnimationComplete?: () => void
}

const Scene: React.FC<SceneProps> = ({ isNightMode, isEntering = false, onAnimationComplete }) => {
  const sceneRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.SpotLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)
  // Day directional lights (3-point): key, fill, rim
  const dirKeyRef = useRef<THREE.DirectionalLight>(null)
  const dirFillRef = useRef<THREE.DirectionalLight>(null)
  const dirRimRef = useRef<THREE.DirectionalLight>(null)
  const dirTargetRef = useRef<THREE.Object3D>(null)
  const controlsRef = useRef<any>(null)
  const { gl, camera } = useThree()
  // Toggle third-person player control for POPClem (true => camera is driven behind the player)
  const PLAYER_CONTROLLED = true

  // Animation de caméra
  const [animationState, setAnimationState] = useState<{
    isAnimating: boolean
    startTime: number
    startPosition: THREE.Vector3
    endPosition: THREE.Vector3
  } | null>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Fonction easing
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  // Démarrer l'animation d'entrée
  useEffect(() => {
    if (isEntering && !animationState && !hasAnimated) {
      const startPos = new THREE.Vector3(0, 2, 0) // Position du portail
      const endPos = new THREE.Vector3(0, 6, 10) // Position finale optimale pour OrbitControls
      
      setAnimationState({
        isAnimating: true,
        startTime: Date.now(),
        startPosition: startPos,
        endPosition: endPos
      })
      setHasAnimated(true)
    }
  }, [isEntering, animationState, hasAnimated])

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
  useFrame(() => {
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
      // Distance fixe du centre (0,0,0)
      const camPos = camera.position.clone()
      const radius = 4.5 // distance fixe
      const fixedHeight = 3// hauteur fixe pour la lumière

      // Calculer l'angle polaire de la caméra autour du centre
      const angle = Math.atan2(camPos.z, camPos.x)
      // Placer la lumière sur le cercle à hauteur fixe
      const lightPos = new THREE.Vector3(
        Math.cos(angle) * radius,
        fixedHeight,
        Math.sin(angle) * radius
      )
      lightRef.current.position.copy(lightPos)

      // La cible est verticalement sous la lumière
      const targetPos = lightPos.clone()
      targetPos.y = 2 // cible à hauteur fixe sous la lumière
      targetRef.current.position.copy(targetPos)
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
      {/* Contrôles de caméra */}
      <OrbitControls
        ref={controlsRef}
  enabled={!animationState?.isAnimating && !PLAYER_CONTROLLED}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
        minDistance={6}
        maxDistance={12}
        minPolarAngle={Math.PI / 2.8}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={false}
        autoRotateSpeed={0}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />

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
        <ProjectBuildings isNightMode={isNightMode} />
      </group>

      /* Nuage d'étoiles 3D dans le ciel - seulement en mode nuit */
      {isNightMode && <StarField count={1200} radius={180} color="#fff" size={8} /> || 
        <Sky
          sunPosition={[100, 100, 100]}
          distance={450000}
          turbidity={10}
          rayleigh={0.2} // Baisse la luminosité du ciel
          mieCoefficient={0.005} // Optionnel : réduit l'éblouissement
          mieDirectionalG={0.7} // Optionnel : rend la lumière plus douce
        />
      }

      <Portal />

      {/* Océan infini adaptatif */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          color={isNightMode ? "#050510" : "#1E90FF"}
          transparent
          opacity={isNightMode ? 0.9 : 0.7}
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

  <POPClemGLTF 
    position={[0, 1, 1]} 
    scale={0.05} 
    playerControlled={PLAYER_CONTROLLED} 
    moveSpeed={2.2} 
    cameraDistance={4} 
    cameraHeight={2.2} 
    showHitboxes={false} 
  />

      {/* Fog pour l'atmosphère adaptatif */}
      <fog attach="fog" args={[isNightMode ? '#000005' : '#87CEEB', 8, 25]} />

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
