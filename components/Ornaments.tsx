
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';
import { TreeMorphState, OrnamentType, OrnamentInstance } from '../types';

interface OrnamentsProps {
  state: TreeMorphState;
}

const StarShape = new THREE.Shape();
const points = 5;
const outerRadius = 1.2;
const innerRadius = 0.6;
for (let i = 0; i < points * 2; i++) {
  const r = (i % 2 === 0) ? outerRadius : innerRadius;
  const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 10;
  const x = Math.cos(a) * r;
  const y = Math.sin(a) * r;
  if (i === 0) StarShape.moveTo(x, y);
  else StarShape.lineTo(x, y);
}
StarShape.closePath();

const extrudeSettings = {
  steps: 1,
  depth: 0.4,
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.1,
  bevelSegments: 2,
};

const TopStar: React.FC<{ state: TreeMorphState }> = ({ state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const positions = useMemo(() => {
    const treePos = new THREE.Vector3(0, CONFIG.TREE_HEIGHT / 2 + 1.0, 0);
    const r = CONFIG.SCATTER_RADIUS * 0.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const scatterPos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
    return { treePos, scatterPos };
  }, []);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;
    const target = state === TreeMorphState.TREE_SHAPE ? positions.treePos : positions.scatterPos;
    const speed = state === TreeMorphState.TREE_SHAPE ? 2.0 : 1.0;
    meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, target.x, speed, delta);
    meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, target.y, speed, delta);
    meshRef.current.position.z = THREE.MathUtils.damp(meshRef.current.position.z, target.z, speed, delta);
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={meshRef} castShadow>
      <extrudeGeometry args={[StarShape, extrudeSettings]} />
      <meshStandardMaterial 
        color={COLORS.GOLD} 
        emissive={COLORS.GOLD}
        emissiveIntensity={0.5}
        metalness={1.0}
        roughness={0.1}
      />
    </mesh>
  );
};

const useOrnamentAnimation = (
  instances: OrnamentInstance[],
  state: TreeMorphState,
  meshRef: React.RefObject<THREE.InstancedMesh | null>
) => {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPositions = useMemo(() => {
    const arr = new Float32Array(instances.length * 3);
    instances.forEach((inst, i) => {
      arr[i * 3] = inst.scatterPos[0];
      arr[i * 3 + 1] = inst.scatterPos[1];
      arr[i * 3 + 2] = inst.scatterPos[2];
    });
    return arr;
  }, [instances]);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;
    const damping = state === TreeMorphState.TREE_SHAPE ? 2.5 : 1.5;
    instances.forEach((inst, i) => {
      const target = state === TreeMorphState.TREE_SHAPE ? inst.treePos : inst.scatterPos;
      const idx = i * 3;
      currentPositions[idx] = THREE.MathUtils.damp(currentPositions[idx], target[0], damping, delta);
      currentPositions[idx+1] = THREE.MathUtils.damp(currentPositions[idx+1], target[1], damping, delta);
      currentPositions[idx+2] = THREE.MathUtils.damp(currentPositions[idx+2], target[2], damping, delta);
      dummy.position.set(currentPositions[idx], currentPositions[idx+1], currentPositions[idx+2]);
      const rotSpeed = 0.5;
      dummy.rotation.x = inst.rotation[0] + (stateThree.clock.getElapsedTime() * (rotSpeed * 0.5));
      dummy.rotation.y = inst.rotation[1] + (stateThree.clock.getElapsedTime() * rotSpeed);
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  useEffect(() => {
    if (meshRef.current) {
        instances.forEach((inst, i) => {
            const c = new THREE.Color(inst.color);
            if (inst.type === OrnamentType.STAR) c.multiplyScalar(2.0); 
            meshRef.current?.setColorAt(i, c);
        });
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [instances, meshRef]);
};

const Ornaments: React.FC<OrnamentsProps> = ({ state }) => {
  const { gifts, baubles, stars, toruses, icicles } = useMemo(() => {
    const gifts: OrnamentInstance[] = [];
    const baubles: OrnamentInstance[] = [];
    const stars: OrnamentInstance[] = [];
    const toruses: OrnamentInstance[] = [];
    const icicles: OrnamentInstance[] = [];
    
    const count = CONFIG.ORNAMENT_COUNT; 
    
    for (let i = 0; i < count; i++) {
      let type: OrnamentType;
      const rand = Math.random();
      if (rand < 0.35) type = OrnamentType.BAUBLE;
      else if (rand < 0.55) type = OrnamentType.GIFT;
      else if (rand < 0.70) type = OrnamentType.TORUS;
      else if (rand < 0.85) type = OrnamentType.ICICLE;
      else type = OrnamentType.STAR;

      const r = CONFIG.SCATTER_RADIUS * (0.5 + Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const scatterPos: [number, number, number] = [
         r * Math.sin(phi) * Math.cos(theta),
         r * Math.sin(phi) * Math.sin(theta),
         r * Math.cos(phi)
      ];

      const bias = Math.pow(Math.random(), 2.5);
      const h = CONFIG.TREE_HEIGHT;
      const y = (bias * h) - (h / 2);
      const yNorm = (y + h/2) / h;
      const maxR = (CONFIG.TREE_RADIUS_BASE * (1.0 - yNorm));
      let rDist = maxR * (0.8 + 0.2 * Math.random());
      const angle = Math.random() * Math.PI * 2;
      const treePos: [number, number, number] = [
        Math.cos(angle) * rDist,
        y,
        Math.sin(angle) * rDist
      ];
      
      const rot: [number, number, number] = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
      let scale = 1.0;
      let color = COLORS.GOLD.getStyle();

      if (type === OrnamentType.GIFT) {
          scale = 0.5 + Math.random() * 0.4;
          const cRand = Math.random();
          if (cRand > 0.9) color = COLORS.RED_DARK.getStyle();
          else if (cRand > 0.7) color = COLORS.GOLD.getStyle();
          else if (cRand > 0.4) color = COLORS.EMERALD.getStyle();
          else color = COLORS.EMERALD_LIGHT.getStyle();
      } else if (type === OrnamentType.BAUBLE) {
          scale = 0.3 + Math.random() * 0.4;
          const cRand = Math.random();
          if (cRand > 0.9) color = COLORS.RED_DARK.getStyle(); 
          else if (cRand > 0.5) color = COLORS.EMERALD.getStyle();
          else if (cRand > 0.2) color = COLORS.EMERALD_LIGHT.getStyle();
          else color = COLORS.GOLD.getStyle();
      } else if (type === OrnamentType.TORUS) {
          scale = 0.3 + Math.random() * 0.3;
          color = Math.random() > 0.3 ? COLORS.EMERALD_LIGHT.getStyle() : COLORS.GOLD.getStyle();
      } else if (type === OrnamentType.ICICLE) {
          scale = 0.4 + Math.random() * 0.4;
          color = '#E0FFFF';
      } else if (type === OrnamentType.STAR) {
          scale = 0.3 + Math.random() * 0.3;
          color = '#FFD700'; 
      }

      const instance = { id: i, type, scatterPos, treePos, rotation: rot, scale, color };
      if (type === OrnamentType.GIFT) gifts.push(instance);
      else if (type === OrnamentType.BAUBLE) baubles.push(instance);
      else if (type === OrnamentType.TORUS) toruses.push(instance);
      else if (type === OrnamentType.ICICLE) icicles.push(instance);
      else stars.push(instance);
    }
    return { gifts, baubles, stars, toruses, icicles };
  }, []);

  const giftRef = useRef<THREE.InstancedMesh>(null);
  const baubleRef = useRef<THREE.InstancedMesh>(null);
  const starRef = useRef<THREE.InstancedMesh>(null);
  const torusRef = useRef<THREE.InstancedMesh>(null);
  const icicleRef = useRef<THREE.InstancedMesh>(null);

  useOrnamentAnimation(gifts, state, giftRef);
  useOrnamentAnimation(baubles, state, baubleRef);
  useOrnamentAnimation(stars, state, starRef);
  useOrnamentAnimation(toruses, state, torusRef);
  useOrnamentAnimation(icicles, state, icicleRef);

  return (
    <group>
        <TopStar state={state} />
        <instancedMesh ref={giftRef} args={[undefined, undefined, gifts.length]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial roughness={0.15} metalness={0.2} />
        </instancedMesh>
        <instancedMesh ref={baubleRef} args={[undefined, undefined, baubles.length]} castShadow receiveShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial roughness={0.1} metalness={0.8} />
        </instancedMesh>
        <instancedMesh ref={starRef} args={[undefined, undefined, stars.length]} castShadow receiveShadow>
            <octahedronGeometry args={[1.0, 0]} />
            <meshStandardMaterial color="#FFD700" roughness={0.0} metalness={1.0} emissive="#B8860B" emissiveIntensity={0.8} toneMapped={false} />
        </instancedMesh>
        <instancedMesh ref={torusRef} args={[undefined, undefined, toruses.length]} castShadow receiveShadow>
            <torusGeometry args={[0.4, 0.15, 8, 24]} />
            <meshStandardMaterial roughness={0.2} metalness={0.9} />
        </instancedMesh>
        <instancedMesh ref={icicleRef} args={[undefined, undefined, icicles.length]} castShadow receiveShadow>
            <cylinderGeometry args={[0.1, 0.0, 1.5, 8]} />
            <meshPhysicalMaterial color="#E0FFFF" roughness={0.1} metalness={0.2} transmission={0.6} thickness={1.0} />
        </instancedMesh>
    </group>
  );
};

export default Ornaments;
