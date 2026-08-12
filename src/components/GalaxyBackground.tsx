import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vPosition;

  // Simple 3D noise for volume
  float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
  
  float noise(vec3 p){
      vec3 a = floor(p);
      vec3 d = p - a;
      d = d * d * (3.0 - 2.0 * d);

      vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
      vec4 k1 = perm(b.xyxy);
      vec4 k2 = perm(k1.xyxy + b.zzww);

      vec4 c = k2 + a.zzzz;
      vec4 k3 = perm(c);
      vec4 k4 = perm(c + 1.0);

      vec4 o1 = fract(k3 * (1.0 / 41.0));
      vec4 o2 = fract(k4 * (1.0 / 41.0));

      vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
      vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

      return o4.y * d.y + o4.x * (1.0 - d.y);
  }

  // Fractal Brownian Motion
  float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 5; ++i) {
      v += a * noise(x);
      x = x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Normalize position to use as direction for the skysphere
    vec3 dir = normalize(vPosition);
    
    // Rotate coordinates over time for animation
    float s = sin(time * 0.02);
    float c = cos(time * 0.02);
    mat3 rot = mat3(
      c, 0.0, s,
      0.0, 1.0, 0.0,
      -s, 0.0, c
    );
    vec3 p = rot * dir * 3.5; // scale controls density of clouds

    // Generate galactic dust / nebula
    float n1 = fbm(p + vec3(time * 0.02, 0.0, 0.0));
    float n2 = fbm(p * 2.0 - vec3(time * 0.01));
    
    // Color mapping - realistic deep space (mostly black, faint milky way dust)
    vec3 color1 = vec3(0.005, 0.005, 0.01); // Almost black
    vec3 color2 = vec3(0.02, 0.03, 0.05);   // Faint grey/blue dust
    vec3 color3 = vec3(0.05, 0.04, 0.06);   // Slightly lighter dust

    float mix1 = smoothstep(0.4, 0.8, n1);
    float mix2 = smoothstep(0.5, 0.9, n2);
    
    vec3 finalColor = mix(color1, color2, mix1);
    finalColor = mix(finalColor, color3, mix2 * 0.3);

    // Add stars onto the nebula background
    float starNoise = noise(dir * 300.0);
    float stars = smoothstep(0.9, 1.0, starNoise) * (0.5 + 0.5 * sin(time * 2.0 + starNoise * 20.0));
    
    // A few larger, brighter white/blue-white stars
    float bStarNoise = noise(dir * 150.0);
    float bStars = smoothstep(0.985, 1.0, bStarNoise) * 3.0;

    finalColor += vec3(stars) + vec3(bStars * 0.9, bStars * 0.95, bStars);
    
    // Tone mapping and contrast boost
    finalColor = finalColor * finalColor * 1.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function GalaxyBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh scale={200}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          time: { value: 0 }
        }}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
