import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Ring, Text, useTexture, Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../constants/planets';

interface PlanetProps {
  data: PlanetData;
  onClick: (name: string, georgianName: string, position: THREE.Vector3) => void;
  isPaused: boolean;
  isSelected?: boolean;
}

export function Planet({ data, onClick, isPaused, isSelected }: PlanetProps) {
  const orbitRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const texture = useTexture(data.textureUrl);
  // Always call the hook, but for planets without a ring texture, just load the regular texture again (it's cached anyway)
  const ringTexUrl = data.ringTextureUrl || data.textureUrl;
  const ringTexture = useTexture(ringTexUrl);

  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0.2, -1).normalize(), 0), []);

  // Create a random starting angle for orbit
  const startAngle = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!isPaused && orbitRef.current) {
      orbitRef.current.rotation.y += data.orbitSpeed * delta * 0.3;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += data.spinSpeed * delta * 50;
    }
    
    if (isSelected && meshRef.current) {
      const pos = new THREE.Vector3();
      meshRef.current.getWorldPosition(pos);
      clipPlane.constant = clipPlane.normal.dot(pos);
    }
  });

  return (
    <group ref={orbitRef} rotation={[0, startAngle.current, 0]}>
      {/* Position the planet at 'distance' from the center (sun) */}
      <group position={[data.distance, 0, 0]}>
        {/* Planet Sphere */}
        <Sphere 
          ref={meshRef}
          args={[data.size, 64, 64]} 
          onClick={(e) => {
            e.stopPropagation();
            const pos = new THREE.Vector3();
            e.object.getWorldPosition(pos);
            onClick(data.name, data.georgianName, pos);
          }}
          onPointerOver={(e) => { 
            e.stopPropagation(); 
            document.body.style.cursor = 'pointer'; 
            setHovered(true);
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
            setHovered(false);
          }}
        >
          {/* Realistic texture mapping instead of solid color */}
          <meshStandardMaterial 
            map={texture} 
            roughness={0.8} 
            metalness={0.05} 
            side={THREE.DoubleSide}
            clippingPlanes={isSelected ? [clipPlane] : []}
          />
          {hovered && <Outlines thickness={0.05} color={data.color} />}
        </Sphere>
        
        {/* Inner Layers when selected */}
        {isSelected && (
          <group>
            {/* Mantle layer */}
            <Sphere args={[data.size * 0.85, 32, 32]}>
              <meshStandardMaterial color="#b34700" side={THREE.DoubleSide} clippingPlanes={[clipPlane]} />
            </Sphere>
            {/* Outer Core layer */}
            <Sphere args={[data.size * 0.6, 32, 32]}>
              <meshStandardMaterial color="#ff9900" side={THREE.DoubleSide} clippingPlanes={[clipPlane]} />
            </Sphere>
            {/* Inner Core layer (Solid, unclipped) */}
            <Sphere args={[data.size * 0.35, 32, 32]}>
              <meshStandardMaterial color="#ffeba8" emissive="#ffeba8" emissiveIntensity={0.5} />
            </Sphere>
          </group>
        )}

        {/* Ring for Saturn */}
        {data.hasRing && (
          <Ring args={[data.size * 1.4, data.size * 2, 128]} rotation={[-Math.PI / 2.5, 0, 0]}>
            <meshStandardMaterial 
              map={ringTexture || null}
              color={ringTexture ? '#ffffff' : data.color} 
              side={THREE.DoubleSide} 
              transparent 
              opacity={ringTexture ? 1 : 0.7} 
            />
          </Ring>
        )}

        {/* Name floating above the planet */}
        <Text
          position={[0, data.size + 0.1, 0]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="black"
        >
          {data.georgianName}
        </Text>
      </group>
    </group>
  );
}
