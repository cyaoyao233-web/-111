import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Sparkles, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { MorphingTree } from './MorphingTree';
import { TreeState } from '../types';
import * as THREE from 'three';

interface SceneProps {
  treeState: TreeState;
}

// The "Star" on top
const TreeTopper = ({ active }: { active: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);
    
    const starShape = useMemo(() => {
      const shape = new THREE.Shape();
      const sides = 5;
      const radius = 0.8;
      const inset = 0.4;
      for (let i = 0; i < sides * 2; i++) {
        const angle = (i * Math.PI) / sides;
        const r = i % 2 === 0 ? radius : inset;
        const a = angle - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      return shape;
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;
        const targetY = active ? 12 : 25; // Adjusted for taller tree (Height 24, center 0 -> top 12)
        const targetScale = active ? 1.5 : 0;
        
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        groupRef.current.rotation.y += 0.02;
    });

    return (
        <group ref={groupRef} position={[0, 20, 0]}>
             <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh castShadow>
                    <extrudeGeometry args={[starShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 3 }]} />
                    <meshStandardMaterial 
                        color="#FFD700" 
                        emissive="#FFD700" 
                        emissiveIntensity={3} 
                        toneMapped={false}
                        roughness={0.1}
                        metalness={1}
                    />
                </mesh>
                <pointLight distance={15} intensity={3} color="#FFD700" />
            </Float>
        </group>
    )
}

export const Scene: React.FC<SceneProps> = ({ treeState }) => {
  return (
    <Canvas shadows gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}>
      <PerspectiveCamera makeDefault position={[0, 5, 35]} fov={50} />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 3} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={15}
        maxDistance={50}
        autoRotate={treeState === TreeState.SCATTERED}
        autoRotateSpeed={0.5}
      />

      {/* Lighting & Environment - High contrast luxury */}
      <color attach="background" args={['#000000']} />
      
      {/* Ambient Fill */}
      <ambientLight intensity={0.1} color="#001f0f" />
      
      {/* Main Key Light (Warm Gold) */}
      <spotLight 
        position={[20, 30, 20]} 
        angle={0.3} 
        penumbra={1} 
        intensity={200} 
        color="#ffeebb" 
        castShadow 
        shadow-bias={-0.0001}
      />

      {/* Fill Light (Reddish for warmth) */}
      <pointLight position={[-15, 10, -15]} intensity={50} color="#ff0000" distance={50} />

      {/* Rim Light (Cool/Emerald) */}
      <spotLight position={[-10, 20, -20]} angle={0.5} intensity={100} color="#00ff88" />

      {/* Environment Map for Reflections */}
      <Environment preset="night" environmentIntensity={1.0} />

      {/* Dynamic Stardust Background */}
      <Sparkles 
        count={3000} 
        scale={60} 
        size={2} 
        speed={0.2} 
        opacity={0.6} 
        color="#FFF" 
        noise={0.5}
      />

      {/* Core Elements */}
      <group position={[0, -5, 0]}>
        <MorphingTree treeState={treeState} />
        <TreeTopper active={treeState === TreeState.TREE_SHAPE} />
      </group>
      
      {/* Ground Shadow */}
      <ContactShadows resolution={1024} scale={60} blur={3} opacity={0.4} far={15} color="#000000" />

      {/* Post Processing for Cinematic Bloom */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
            luminanceThreshold={1.0} 
            mipmapBlur 
            intensity={1.8} 
            radius={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.03} /> 
      </EffectComposer>
    </Canvas>
  );
};