"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import ArcReactor from "./ArcReactor";

const Jarvis3DScene = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={1} />

        <Suspense fallback={null}>
          {/* Bottom Focal Point: Arc Reactor behind Voice Button */}
          <group position={[0, -2.8, 0.5]} scale={0.3}>
            <ArcReactor />
          </group>
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Suspense>

        {/* Post-processing - simulated glow */}
        {/* Note: In a real environment we would use EffectComposer, but standard materials will suffice for now */}
      </Canvas>
    </div>
  );
};

export default Jarvis3DScene;
