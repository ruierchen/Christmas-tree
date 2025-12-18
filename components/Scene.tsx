
import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import PhotoFrame from './PhotoFrame';
import { TreeMorphState, PhotoFrameData } from '../types';

const ambientLight = 'ambientLight' as any;
const spotLight = 'spotLight' as any;
const pointLight = 'pointLight' as any;
const group = 'group' as any;

interface SceneProps {
  state: TreeMorphState;
  photos: PhotoFrameData[];
  onPhotoClick: (url: string) => void;
  handRotation: [number, number]; // [pitch, yaw]
}

const InteractiveGroup: React.FC<{ children: React.ReactNode, handRotation: [number, number] }> = ({ children, handRotation }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      // Smoothly rotate based on hand position
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, handRotation[1] * 0.8, 0.1);
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, handRotation[0] * 0.3, 0.1);
    }
  });
  return <group ref={ref}>{children}</group>;
};

const Scene: React.FC<SceneProps> = ({ state, photos, onPhotoClick, handRotation }) => {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#000805] via-[#001008] to-[#000000]">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 4, 30], fov: 45 }}
        gl={{ antialias: false, toneMappingExposure: 1.2 }}
      >
        <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <spotLight 
              position={[20, 30, 20]} 
              angle={0.4} 
              penumbra={1} 
              intensity={4} 
              color="#FFD700" 
              castShadow 
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[-15, -5, -10]} intensity={2} color="#046307" />
            <pointLight position={[15, 15, -15]} intensity={1} color="#FFD700" />

            <Environment preset="lobby" />

            <InteractiveGroup handRotation={handRotation}>
              <group position={[0, -2, 0]}>
                  <Foliage state={state} />
                  <Ornaments state={state} />
                  
                  {photos.map((photo) => (
                    <PhotoFrame 
                      key={photo.id}
                      url={photo.url}
                      treePos={photo.treePos}
                      scatterPos={photo.scatterPos}
                      baseRotation={photo.rotation}
                      state={state}
                      onClick={onPhotoClick}
                    />
                  ))}
              </group>
            </InteractiveGroup>

            <ContactShadows opacity={0.6} scale={50} blur={2.4} far={15} resolution={512} color="#000000" position={[0, -10, 0]} />

            <OrbitControls 
                enablePan={false} 
                autoRotate={state === TreeMorphState.TREE_SHAPE} 
                autoRotateSpeed={0.3}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.6}
                maxDistance={50}
                minDistance={15}
            />

            <EffectComposer multisampling={4}>
                <Bloom 
                  luminanceThreshold={0.8} 
                  mipmapBlur 
                  intensity={1.2} 
                  radius={0.7} 
                />
                <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;
