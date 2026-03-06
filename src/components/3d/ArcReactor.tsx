"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from "@react-three/drei";
import * as THREE from "three";

const ArcReactor = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.2;
    }
    
    if (ring1Ref.current) ring1Ref.current.rotation.z = time * 0.5;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -time * 0.8;
    if (ring3Ref.current) ring3Ref.current.rotation.z = time * 0.3;
  });

  return (
    <group ref={groupRef}>
      {/* Outer Glow */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.05} />
      </mesh>

      {/* Main Core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh>
          <torusGeometry args={[0.8, 0.05, 16, 100]} />
          <meshStandardMaterial 
            color="#00f2ff" 
            emissive="#00f2ff" 
            emissiveIntensity={2} 
            metalness={1}
            roughness={0}
          />
        </mesh>
        
        {/* Core Center */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
          <MeshDistortMaterial 
            color="#00f2ff" 
            speed={2} 
            distort={0.3} 
            emissive="#00f2ff"
            emissiveIntensity={5}
          />
        </mesh>
      </Float>

      {/* Rotating Interior Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.6, 0.02, 8, 50]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={1.5} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[1.5, 0, 0]}>
        <torusGeometry args={[0.5, 0.015, 8, 50]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={1} />
      </mesh>

      <mesh ref={ring3Ref} rotation={[0.8, 0.8, 0]}>
        <torusGeometry args={[0.7, 0.01, 8, 40]} />
        <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={1} transparent opacity={0.5} />
      </mesh>
      
      {/* Light Source */}
      <pointLight position={[0, 0, 0]} intensity={20} color="#00f2ff" distance={5} />
    </group>
  );
};

export default ArcReactor;
