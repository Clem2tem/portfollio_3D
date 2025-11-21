'use client';

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import SideInfoPanel from "./SideInfoPanel";

interface Props {
  children: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  label: string;
  description: string;
  extraInfo?: string[];
}

export default function ModelWithSideInfo({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  label,
  description,
  extraInfo = []
}: Props) {
  const [hover, setHover] = useState(false);
  const infoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!infoRef.current) return;

    if (hover) {
      gsap.fromTo(
        infoRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }
      );
    } else {
      gsap.to(infoRef.current, { opacity: 0, duration: 0.25 });
    }
  }, [hover]);

  return (
    <>
      {/* Groupe du modèle */}
      <group position={position} rotation={rotation}>
        
        {children}

        {/* Hotspot invisible */}
        <mesh
          position={[-2.2, 1, 0]}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
        >
          <planeGeometry args={[3, 3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* Panneau HUD */}
      <SideInfoPanel
        label={label}
        description={description}
        extraInfo={extraInfo}
        ref={infoRef}
        visible={hover}
      />
    </>
  );
}
