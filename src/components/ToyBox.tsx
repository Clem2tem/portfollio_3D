import { useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { Text, Image } from '@react-three/drei';

interface ToyBoxProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number]; // width / height / depth
  thickness?: number;
  color?: string;
  headerHeight?: number;
  headerText?: string;
  headerTextSize?: number;
  headerTextColor?: string;
  technologies?: string[];
}

const ToyBox: React.FC<ToyBoxProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size,
  thickness = 0.1,
  color = '#111',
  headerHeight = 0.2,
  headerText = 'MEDCHEM STRUCTURE GENIUS',
  headerTextSize = 0.12,
  headerTextColor = '#fff',
  technologies = [],
}) => {
  const [w, h, d] = size;

  /** 
   * Construction de la box autour de son CENTRE EXACT
   * → La face transparente sera toujours alignée
   */
  const frontZ = d / 2 - thickness / 2;
  const backZ = -d / 2 + thickness / 2;
  const leftX = -w / 2 + thickness / 2;
  const rightX = w / 2 - thickness / 2;

  const topY = h / 2 - thickness / 2;
  const bottomY = -h / 2 + thickness / 2;

  const headerY = h / 2 - headerHeight / 2;

  const materialOpaque = useMemo(
    () =>
      new MeshStandardMaterial({
        color,
        roughness: 1,
        metalness: 0,
      }),
    [color]
  );

  const materialTransparent = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.15,
        roughness: 0.1,
        metalness: 0.8,
        envMapIntensity: 1,
      }),
    []
  );

  return (
    <group position={position} rotation={rotation}>
      {/* BACK */}
      <mesh position={[0, 0, backZ]} material={materialOpaque}>
        <boxGeometry args={[w, h, thickness]} />
      </mesh>

      {/* LEFT */}
      <mesh position={[leftX, 0, 0]} material={materialOpaque}>
        <boxGeometry args={[thickness, h, d]} />
      </mesh>
      
      {/* TECHNOLOGY LOGOS on left side */}
      {technologies.length > 0 && (
        <group position={[leftX - 0.05, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          {technologies.map((tech, index) => {
            const logoSize = 0.15;
            const padding = 0.05;
            
            // Calculate grid dimensions
            const cols = Math.ceil(Math.sqrt(technologies.length));
            const rows = Math.ceil(technologies.length / cols);
            
            // Calculate available space
            const availableWidth = d - padding * 2;
            const availableHeight = h - padding * 2;
            
            // Calculate spacing
            const spacingX = availableWidth / cols;
            const spacingY = availableHeight / rows;
            
            // Get grid position
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            // Calculate position (centered in grid cell)
            const xPos = -availableWidth / 2 + spacingX / 2 + col * spacingX;
            const yPos = availableHeight / 2 - spacingY / 2 - row * spacingY;
            
            // Map technology names to logo paths
            const logoMap: Record<string, string> = {
              'React': '/logos/React.png',
              'Node.js': '/logos/Node.js.png',
              'Next.js': '/logos/Next.js.png',
              'TypeScript': '/logos/TypeScript.svg',
              'Firebase': '/logos/Firebase.png',
              'Supabase': '/logos/Supabase.png',
              'Vercel': '/logos/Vercel.svg',
              'Git': '/logos/Git.png',
              'Google Cloud': '/logos/Google_Cloud.svg',
            };
            
            const logoPath = logoMap[tech];
            if (!logoPath) return null;
            
            return (
              <Image
                key={tech}
                url={logoPath}
                position={[xPos, yPos, 0]}
                scale={Math.min(logoSize, spacingX * 0.7, spacingY * 0.7)}
                transparent
              />
            );
          })}
        </group>
      )}

      {/* RIGHT */}
      <mesh position={[rightX, 0, 0]} material={materialOpaque}>
        <boxGeometry args={[thickness, h, d]} />
      </mesh>

      {/* BOTTOM */}
      <mesh position={[0, bottomY, 0]} material={materialOpaque}>
        <boxGeometry args={[w, thickness, d]} />
      </mesh>

      {/* TOP */}
      <mesh position={[0, topY, 0]} material={materialOpaque}>
        <boxGeometry args={[w, thickness, d]} />
      </mesh>

      {/* TOP HEADER (OPAQUE) */}
      <mesh position={[0, headerY, frontZ]} material={materialOpaque}>
        <boxGeometry args={[w, headerHeight, thickness]} />
        <Text position={[0, -0.01, 0.01]} fontSize={headerTextSize} color={headerTextColor} font="/fonts/Chewy-Regular.ttf">
          {headerText}
        </Text>
      </mesh>

      {/* FRONT WINDOW - toujours parfaitement alignée */}
      <mesh position={[0, 0, frontZ+0.001]} material={materialTransparent}>
        <boxGeometry args={[w - 0.001, h - 0.001, thickness]} />
      </mesh>

    </group>
  );
};

export default ToyBox;
