
import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, Vector3Array } from '../types';
import { COLORS } from '../constants';

const group = 'group' as any;
const mesh = 'mesh' as any;
const boxGeometry = 'boxGeometry' as any;
const meshPhysicalMaterial = 'meshPhysicalMaterial' as any;
const planeGeometry = 'planeGeometry' as any;
const meshStandardMaterial = 'meshStandardMaterial' as any;

interface PhotoFrameProps {
  url: string;
  treePos: Vector3Array;
  scatterPos: Vector3Array;
  baseRotation: Vector3Array;
  state: TreeMorphState;
  onClick: (url: string) => void;
}

const PhotoFrame: React.FC<PhotoFrameProps> = ({ url, treePos, scatterPos, baseRotation, state, onClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, url);

  const tPos = useMemo(() => new THREE.Vector3(...treePos), [treePos]);
  const sPos = useMemo(() => new THREE.Vector3(...scatterPos), [scatterPos]);
  const bRot = useMemo(() => new THREE.Euler(...baseRotation), [baseRotation]);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;
    
    const isTree = state === TreeMorphState.TREE_SHAPE;
    const targetPos = isTree ? tPos : sPos;
    
    const targetRot = isTree 
      ? bRot 
      : new THREE.Euler(
          bRot.x + Math.sin(stateThree.clock.elapsedTime * 0.3 + treePos[0]) * 0.4,
          bRot.y + stateThree.clock.elapsedTime * 0.2,
          bRot.z + Math.cos(stateThree.clock.elapsedTime * 0.3 + treePos[1]) * 0.2
        );
    
    meshRef.current.position.lerp(targetPos, 0.06);
    meshRef.current.quaternion.slerp(new THREE.Quaternion().setFromEuler(targetRot), 0.06);
  });

  return (
    <group 
      ref={meshRef} 
      onClick={(e) => { e.stopPropagation(); onClick(url); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Polaroid Body (White) */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 1.5, 0.05]} />
        <meshPhysicalMaterial 
          color="#fefefe" 
          roughness={0.2}
          metalness={0.0}
          clearcoat={0.5}
        />
      </mesh>
      
      {/* Gold Rim Detail */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.22, 1.52, 0.02]} />
        <meshPhysicalMaterial color={COLORS.GOLD} metalness={1} roughness={0.1} />
      </mesh>

      {/* Photo Surface */}
      <mesh position={[0, 0.1, 0.03]}>
        <planeGeometry args={[1.05, 1.05]} />
        <meshStandardMaterial map={texture} roughness={0.1} />
      </mesh>

      {/* Glossy Overlay */}
      <mesh position={[0, 0.1, 0.031]}>
        <planeGeometry args={[1.05, 1.05]} />
        <meshPhysicalMaterial transparent opacity={0.1} transmission={0.9} roughness={0} />
      </mesh>

      {/* Polaroid Bottom Label Area */}
      <mesh position={[0, -0.55, 0.03]}>
        <planeGeometry args={[1, 0.2]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
    </group>
  );
};

export default PhotoFrame;
