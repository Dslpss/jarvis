"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";

export function JarvisCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Pulsating animation based on time
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (meshRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y += 0.005;
    }
    if (glowRef.current) {
      const glowScale = 1.2 + Math.sin(time * 4) * 0.1;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(time * 2) * 0.1;
    }
  });

  return (
    <group>
      {/* Central Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#00f2ff"
          speed={3}
          distort={0.4}
          radius={1}
          emissive="#004466"
          emissiveIntensity={2}
          roughness={0}
          metalness={1}
        />
      </mesh>

      {/* Atmospheric Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color="#00f2ff"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Orbiting particles/rings could be added here */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.8, 0.02, 16, 100]} />
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.4} />
        </mesh>
      </Float>
      
      <Float speed={1.5} rotationIntensity={1} floatIntensity={0.5}>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <torusGeometry args={[2.2, 0.01, 16, 100]} />
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.2} />
        </mesh>
      </Float>
    </group>
  );
}
