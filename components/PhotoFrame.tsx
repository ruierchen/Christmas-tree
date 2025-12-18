
import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, Vector3Array } from '../types';
import { COLORS } from '../constants';

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
  
  // Use useMemo to prevent re-loading texture on every render
  const texture = useLoader(THREE.TextureLoader, url);

  const tPos = useMemo(() => new THREE.Vector3(...treePos), [treePos]);
  const sPos = useMemo(() => new THREE.Vector3(...scatterPos), [scatterPos]);
  const bRot = useMemo(() => new THREE.Euler(...baseRotation), [baseRotation]);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;
    
    const isTree = state === TreeMorphState.TREE_SHAPE;
    const targetPos = isTree ? tPos : sPos;
    
    // In scattered mode, add some "floating memory" rotation
    const targetRot = isTree 
      ? bRot 
      : new THREE.Euler(
          bRot.x + Math.sin(stateThree.clock.elapsedTime * 0.4) * 0.5,
          bRot.y + stateThree.clock.elapsedTime * 0.2,
          bRot.z + Math.cos(stateThree.clock.elapsedTime * 0.4) * 0.3
        );
    
    meshRef.current.position.lerp(targetPos, 0.05);
    meshRef.current.quaternion.slerp(new THREE.Quaternion().setFromEuler(targetRot), 0.05);
  });

  return (
    <group 
      ref={meshRef} 
      onClick={(e) => {
        e.stopPropagation();
        // Allow clicking in both states
        onClick(url);
      }}
      onPointerOver={() => { 
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => { 
        document.body.style.cursor = 'default';
      }}
    >
      {/* Frame Border */}
      <mesh castShadow>
        <boxGeometry args={[1.1, 1.4, 0.1]} />
        <meshPhysicalMaterial 
          color={COLORS.GOLD} 
          metalness={1} 
          roughness={0.1}
          reflectivity={1}
          clearcoat={1}
        />
      </mesh>
      
      {/* Photo Face */}
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[1, 1.3]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Back side of frame */}
      <mesh position={[0, 0, -0.055]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1, 1.3]} />
        <meshStandardMaterial color={COLORS.GOLD_DIM} metalness={0.8} />
      </mesh>
    </group>
  );
};

export default PhotoFrame;
