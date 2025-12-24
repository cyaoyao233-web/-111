import * as THREE from 'three';

export interface ParticleData {
  id: string;
  scatterPosition: THREE.Vector3;
  treePosition: THREE.Vector3;
  scatterRotation: THREE.Euler;
  treeRotation: THREE.Euler;
  scale: number;
  color: THREE.Color;
  speed: number;
  type: 'cube' | 'sphere';
}

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface MorphingTreeProps {
  treeState: TreeState;
}