import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text, useTexture, Line, Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { PLANETS } from '../constants/planets';
import { Planet } from './Planet';
import { GalaxyBackground } from './GalaxyBackground';
import sunTextureImg from '../assets/textures/sun.jpg';

interface SolarSystemProps {
  onPlanetClick: (name: string, georgianName: string, position: THREE.Vector3) => void;
  isPaused: boolean;
  isShaking: boolean;
  selectedPlanetId?: string;
}

function OrbitPath({ distance, color }: { distance: number; color: string }) {
  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * distance, 0, Math.sin(theta) * distance));
    }
    return pts;
  }, [distance]);

  return <Line points={points} color={color} transparent opacity={0.2} lineWidth={1} />;
}

export function SolarSystem({ onPlanetClick, isPaused, isShaking, selectedPlanetId }: SolarSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sunRef = useRef<THREE.Mesh>(null);
  const sunTexture = useTexture(sunTextureImg);
  const [sunHovered, setSunHovered] = useState(false);

  // Clipping plane for the Sun
  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0.2, -1).normalize(), 0), []);

  useFrame((_, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.05 * delta;
    }

    if (groupRef.current) {
      if (isShaking) {
        groupRef.current.position.set(
          (Math.random() - 0.5) * 0.1,
          1.2 + (Math.random() - 0.5) * 0.1,
          -3 + (Math.random() - 0.5) * 0.1
        );
      } else {
        // Reset or lerp back to original position
        groupRef.current.position.lerp(new THREE.Vector3(0, 1.2, -3), 0.1);
      }
    }
    
    // Update Sun clipping plane based on its world position if selected
    if (selectedPlanetId === 'Sun' && sunRef.current) {
      const pos = new THREE.Vector3();
      sunRef.current.getWorldPosition(pos);
      clipPlane.constant = clipPlane.normal.dot(pos);
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.2, -3]}>
      {/* Dynamic Galaxy Background */}
      <GalaxyBackground />
      
      {/* Lights - Realistic High Contrast */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={100} color="#fffcf5" decay={2} />

      {/* The Sun */}
      <group>
        <Sphere 
          ref={sunRef}
          args={[0.4, 64, 64]}
          onClick={(e) => {
            e.stopPropagation();
            const pos = new THREE.Vector3();
            e.object.getWorldPosition(pos);
            onPlanetClick('Sun', 'მზე', pos);
          }}
          onPointerOver={(e) => { 
            e.stopPropagation(); 
            document.body.style.cursor = 'pointer'; 
            setSunHovered(true);
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
            setSunHovered(false);
          }}
        >
          <meshStandardMaterial 
            map={sunTexture}
            emissive="#ffebd6"
            emissiveMap={sunTexture}
            emissiveIntensity={1.3}
            toneMapped={false}
            side={THREE.DoubleSide}
            clippingPlanes={selectedPlanetId === 'Sun' ? [clipPlane] : []}
          />
          {sunHovered && <Outlines thickness={0.05} color="#ffebd6" />}
          <Text
            position={[0, 0.6, 0]}
            fontSize={0.15}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#d97700"
          >
            მზე
          </Text>
        </Sphere>
        
        {/* Sun inner layer */}
        {selectedPlanetId === 'Sun' && (
          <Sphere args={[0.39, 32, 32]}>
            <meshStandardMaterial 
              color="#fff000" 
              emissive="#ffea00" 
              emissiveIntensity={1.5} 
              toneMapped={false} 
            />
          </Sphere>
        )}
      </group>

      {/* Orbits */}
      {PLANETS.map((planet) => (
        <OrbitPath key={`orbit-${planet.id}`} distance={planet.distance} color={planet.color} />
      ))}

      {/* Planets */}
      {PLANETS.map((planet) => (
        <Planet 
          key={planet.id} 
          data={planet} 
          onClick={onPlanetClick} 
          isPaused={isPaused} 
          isSelected={selectedPlanetId === planet.name}
        />
      ))}
    </group>
  );
}
