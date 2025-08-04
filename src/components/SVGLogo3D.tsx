import React, { useRef, useMemo, useState } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
// @ts-ignore
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import * as THREE from 'three';

import { Html } from '@react-three/drei';

const SVGLogo3D: React.FC<{
  url: string;
  position: [number, number, number];
  scale?: number;
  private?: boolean;
  onClick?: () => void;
}> = ({ url, position, scale = 0.012, private: isPrivate, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const { paths = [] } = useLoader(SVGLoader, url) || {};
  const groupRef = useRef<THREE.Group>(null);

  // Calcule le centre du SVG pour centrer la rotation
  const center = useMemo(() => {
    const box = new THREE.Box2();
    paths.forEach((path: any) => {
      path.toShapes(true).forEach((shape: any) => {
        const points = shape.getPoints();
        points.forEach((pt: any) => box.expandByPoint(new THREE.Vector2(pt.x, pt.y)));
      });
    });
    const c = box.getCenter(new THREE.Vector2());
    return c;
  }, [paths]);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.set(position[0], position[1] + 0.8 + Math.sin(t * 2) * 0.05, position[2]);
      groupRef.current.rotation.y = t * 0.8;
    }
  });

  let hasValidShape = false;
  if (paths && paths.length > 0) {
    for (const path of paths) {
      let shapes = [];
      try {
        shapes = path.toShapes(true);
      } catch (e) {}
      if (shapes && shapes.length > 0) {
        hasValidShape = true;
        break;
      }
    }
  }
  if (!paths || paths.length === 0 || !hasValidShape) {
    // Fallback: box blanche
    return (
      <group ref={groupRef} scale={[scale, scale, scale]} onClick={onClick} position={position}>
        <mesh>
          <boxGeometry args={[60, 60, 8]} />
          <meshStandardMaterial color={'#ff00f2'} metalness={0.2} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      scale={[scale, -scale, scale]}
      onClick={onClick}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <group position={[-center.x, -center.y, 0]}>
        {paths.map((path: any, i: number) => {
          let shapes = [];
          try {
            shapes = path.toShapes(true);
          } catch (e) {
            return null;
          }
          if (!shapes || shapes.length === 0) return null;
          let pathColor = '#ff00f2';
          if (path.userData && path.userData.style && path.userData.style.fill && path.userData.style.fill !== 'none') {
            pathColor = path.userData.style.fill;
          } else if (path.color && path.color.isColor) {
            pathColor = '#' + path.color.getHexString();
          }
          return (
            <mesh key={i}>
              <extrudeGeometry
                args={[
                  shapes,
                  { depth: 40, bevelEnabled: true, bevelThickness: 5, bevelSize: 5, bevelSegments: 2 },
                ]}
              />
              <meshStandardMaterial 
                color={pathColor} 
                metalness={0.2} 
                roughness={0.7} 
                emissive={pathColor}
                emissiveIntensity={0.7}
              />
            </mesh>
          );
        })}
      </group>
      {hovered && (
        <Html center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '10px 18px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            boxShadow: '0 2px 12px #0008',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            transform: 'translateY(-150%)',
          }}>
            {isPrivate ? 'Site public de l\'entreprise car ressource interne' : 'Accéder à l\'application/site'}
          </div>
        </Html>
      )}
    </group>
  );
};

export default SVGLogo3D;