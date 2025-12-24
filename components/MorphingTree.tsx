import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, ParticleData } from '../types';

interface MorphingTreeProps {
  treeState: TreeState;
}

const COUNT = 2000;
const TREE_HEIGHT = 24;
const BASE_RADIUS = 8; // Diameter 16

const COLORS = [
  new THREE.Color(0xffd966), // Champagne Gold
  new THREE.Color(0x03180a), // Deep Forest Green
  new THREE.Color(0x990000), // Gem Red
];

// Helper Class for Particle Logic
class ParticleSystem {
  static generateParticles(count: number): ParticleData[] {
    const data: ParticleData[] = [];
    
    for (let i = 0; i < count; i++) {
      // 0. General Math
      const t = i / count;
      
      // 1. Tree Shape (Archimedean Spiral on Cone)
      const angle = t * Math.PI * 40; // Dense spiral
      const y = (t * TREE_HEIGHT) - (TREE_HEIGHT / 2);
      const r = BASE_RADIUS * (1 - t); // Taper to top
      const randomR = r + (Math.random() - 0.5) * 1.5;
      
      const treePos = new THREE.Vector3(
        Math.cos(angle) * randomR,
        y,
        Math.sin(angle) * randomR
      );

      // 2. Scatter Shape (Spherical Nebula)
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const scatterR = 15 * Math.cbrt(Math.random());
      const scatterPos = new THREE.Vector3(
        scatterR * Math.sin(phi) * Math.cos(theta),
        scatterR * Math.sin(phi) * Math.sin(theta),
        scatterR * Math.cos(phi)
      );

      // Rotations
      const treeRot = new THREE.Euler(Math.random(), -angle, Math.random());
      const scatterRot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      data.push({
        id: `p-${i}`,
        treePosition: treePos,
        scatterPosition: scatterPos,
        treeRotation: treeRot,
        scatterRotation: scatterRot,
        scale: 0.2 + Math.random() * 0.6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: 0.01 + Math.random() * 0.04,
        type: Math.random() > 0.4 ? 'cube' : 'sphere'
      });
    }
    return data;
  }
}

export const MorphingTree: React.FC<MorphingTreeProps> = ({ treeState }) => {
  const cubesRef = useRef<THREE.InstancedMesh>(null);
  const spheresRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate Data Once
  const particles = useMemo(() => ParticleSystem.generateParticles(COUNT), []);
  
  // Split particles into types
  const cubeParticles = useMemo(() => particles.filter(p => p.type === 'cube'), [particles]);
  const sphereParticles = useMemo(() => particles.filter(p => p.type === 'sphere'), [particles]);

  // Persistent simulation state
  const simulationState = useMemo(() => {
     return particles.map(p => ({
         pos: p.scatterPosition.clone(),
         rot: p.scatterRotation.clone(),
         scale: p.scale
     }));
  }, [particles]);

  useFrame((state, delta) => {
      const time = state.clock.elapsedTime;
      const isTree = treeState === TreeState.TREE_SHAPE;
      const isScatter = treeState === TreeState.SCATTERED;

      // Update particles
      let cubeIdx = 0;
      let sphereIdx = 0;

      for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const sim = simulationState[i];

          // Determine Target
          let targetPos = p.scatterPosition;
          let targetRot = p.scatterRotation;
          
          if (isTree) {
              targetPos = p.treePosition;
              targetRot = p.treeRotation;
          }

          // Apply some idle motion to targets
          const floatIntensity = isTree ? 0.1 : 0.5;
          const floatX = Math.sin(time * p.speed + i) * floatIntensity;
          const floatY = Math.cos(time * p.speed * 0.8 + i) * floatIntensity;
          
          const destX = targetPos.x + floatX;
          const destY = targetPos.y + floatY;
          const destZ = targetPos.z;

          // Damp Towards Target
          const smooth = 2.5;
          
          sim.pos.x = THREE.MathUtils.damp(sim.pos.x, destX, smooth, delta);
          sim.pos.y = THREE.MathUtils.damp(sim.pos.y, destY, smooth, delta);
          sim.pos.z = THREE.MathUtils.damp(sim.pos.z, destZ, smooth, delta);

          sim.rot.x = THREE.MathUtils.damp(sim.rot.x, targetRot.x, 2, delta);
          sim.rot.y = THREE.MathUtils.damp(sim.rot.y, targetRot.y + (isScatter ? time * 0.2 : 0), 2, delta);
          sim.rot.z = THREE.MathUtils.damp(sim.rot.z, targetRot.z, 2, delta);

          // Update Matrix
          dummy.position.copy(sim.pos);
          dummy.rotation.set(sim.rot.x, sim.rot.y, sim.rot.z);
          dummy.scale.setScalar(sim.scale);
          dummy.updateMatrix();

          // Assign to correct mesh
          if (p.type === 'cube') {
              if (cubesRef.current) {
                  cubesRef.current.setMatrixAt(cubeIdx, dummy.matrix);
                  cubesRef.current.setColorAt(cubeIdx, p.color);
                  cubeIdx++;
              }
          } else {
              if (spheresRef.current) {
                  spheresRef.current.setMatrixAt(sphereIdx, dummy.matrix);
                  spheresRef.current.setColorAt(sphereIdx, p.color);
                  sphereIdx++;
              }
          }
      }
      
      if (cubesRef.current) {
          cubesRef.current.instanceMatrix.needsUpdate = true;
          if (cubesRef.current.instanceColor) cubesRef.current.instanceColor.needsUpdate = true;
      }
      
      if (spheresRef.current) {
          spheresRef.current.instanceMatrix.needsUpdate = true;
          if (spheresRef.current.instanceColor) spheresRef.current.instanceColor.needsUpdate = true;
      }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Cubes */}
      <instancedMesh ref={cubesRef} args={[undefined, undefined, cubeParticles.length]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} /> 
        <meshStandardMaterial 
            roughness={0.15}
            metalness={0.9}
            envMapIntensity={1.5}
            toneMapped={false}
        />
      </instancedMesh>

      {/* Spheres */}
      <instancedMesh ref={spheresRef} args={[undefined, undefined, sphereParticles.length]} castShadow receiveShadow>
        <sphereGeometry args={[0.36, 16, 16]} />
        <meshStandardMaterial 
            roughness={0.1}
            metalness={1.0}
            envMapIntensity={2.0}
            toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
};