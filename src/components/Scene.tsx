import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Environment} from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import StarField from './StarField'
import Island from './Island'
import ProjectBuildings from './ProjectBuildings'

const Scene: React.FC = () => {
  const sceneRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.SpotLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)
  const { gl, camera } = useThree()

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
    ;(canvas.style as any).mozUserSelect = 'none'
    ;(canvas.style as any).msUserSelect = 'none'
    
    return () => {
      canvas.ondragstart = null
      canvas.onselectstart = null
      canvas.oncontextmenu = null
    }
  }, [gl])
  
  // Synchronize spotlight position with camera
  useFrame(() => {
    if (lightRef.current && targetRef.current) {
      // Distance fixe du centre (0,0,0)
      const camPos = camera.position.clone()
      const radius = 3 // distance fixe
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
  })

  return (
    <>
      {/* Contrôles de caméra */}
      <OrbitControls
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

      {/* Éclairage de base très sombre */}
      <ambientLight intensity={0.05} color="#1a1a2e" />

      {/* Lumière spot qui suit la caméra et forme un cône */}
      <spotLight
      ref={lightRef}
      intensity={5}
      color="#ffffff"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={15}
      shadow-camera-left={-4}
      shadow-camera-right={4}
      shadow-camera-top={4}
      shadow-camera-bottom={-4}
      angle={Math.PI / 4} // Angle du cône de lumière
      penumbra={0.2} // Douceur des bords
      distance={20}
      decay={2}
      position={[0, 0, 0]} // Position initiale, sera synchronisée avec la caméra
      />
      {/* Objet cible invisible pour la lumière spot */}
      <object3D ref={targetRef} />
      <group ref={sceneRef}>
      {/* L'île principale */}
      <Island />

      {/* Les bâtiments représentant les projets */}
      <ProjectBuildings />
      </group>

      {/* Nuage d'étoiles 3D dans le ciel */}
      <StarField count={1200} radius={180} color="#fff" size={8} />

      {/* Environnement HDR pour les réflections */}
      <Environment preset="night" />

      {/* Océan infini */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial
        color="#0f172a"
        transparent
        opacity={0.8}
        roughness={0.1}
        metalness={0.1}
      />
      </mesh>

      {/* Fog pour l'atmosphère plus sombre */}
      <fog attach="fog" args={['#0d0022', 1, 12]} />
    </>
  )
}

export default Scene
