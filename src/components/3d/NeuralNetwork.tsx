"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NeuralNetwork = () => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  const nodeCount = 120;
  
  // Create structured positions: layered shells
  const [positions, connections, pulseData] = useMemo(() => {
    const pos: number[] = [];
    // Central core (virtual)
    const shells = [0.8, 1.2, 1.6];
    const nodesPerShell = [20, 40, 60];

    shells.forEach((radius, shellIndex) => {
      const count = nodesPerShell[shellIndex];
      for (let i = 0; i < count; i++) {
        // Simple Fibonacci sphere distribution for uniform nodes
        const phi = Math.acos(1 - 2 * (i + 0.5) / count);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

        pos.push(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
      }
    });

    const linePos: number[] = [];
    const pulses: any[] = [];
    
    // Connect nodes to neighbors and across shells
    for (let i = 0; i < pos.length / 3; i++) {
      const p1 = new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      
      for (let j = i + 1; j < pos.length / 3; j++) {
        const p2 = new THREE.Vector3(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
        const dist = p1.distanceTo(p2);
        
        // Connect if close enough
        if (dist < 0.7) {
          linePos.push(p1.x, p1.y, p1.z);
          linePos.push(p2.x, p2.y, p2.z);

          if (Math.random() > 0.92) {
            pulses.push({
              start: p1.clone(),
              end: p2.clone(),
              speed: 0.3 + Math.random() * 0.4,
              offset: Math.random()
            });
          }
        }
      }
    }

    return [new Float32Array(pos), new Float32Array(linePos), pulses];
  }, []);

  const pulseRefs = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.08;
      groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.05;
      
      // Add a slight "breathing" effect to the whole group
      const s = 1 + Math.sin(time * 0.5) * 0.05;
      groupRef.current.scale.set(s, s, s);
    }

    if (coreRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.1;
      coreRef.current.scale.set(scale, scale, scale);
      // Pulsing opacity for the core
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(time * 2) * 0.1;
    }

    if (pulseRefs.current) {
      pulseRefs.current.children.forEach((child, i) => {
        const data = pulseData[i];
        if (!data) return;
        const t = ((time * data.speed + data.offset) % 1);
        child.position.lerpVectors(data.start, data.end, t);
        const opacity = Math.sin(t * Math.PI);
        (child as any).material.opacity = opacity * 0.6;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Energy Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial 
          color="#40ffff" 
          transparent 
          opacity={0.3} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
      <mesh scale={0.7}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.1} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>

      {/* Pulse Data Particles */}
      <group ref={pulseRefs}>
        {pulseData.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#00f2ff" transparent opacity={0} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>

      {/* Neural Nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          color="#00f2ff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Holographic shell dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#00f2ff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Connections (The "Web") */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[connections, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};

export default NeuralNetwork;
