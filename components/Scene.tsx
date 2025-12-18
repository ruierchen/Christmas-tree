
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import PhotoFrame from './PhotoFrame';
import { TreeMorphState, PhotoFrameData } from '../types';

interface SceneProps {
  state: TreeMorphState;
  photos: PhotoFrameData[];
  onPhotoClick: (url: string) => void;
}

const Scene: React.FC<SceneProps> = ({ state, photos, onPhotoClick }) => {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#001008] to-[#000502]">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 45], fov: 45 }}
        gl={{ antialias: false, toneMappingExposure: 1.5 }}
      >
        <Suspense fallback={null}>
            <ambientLight intensity={0.2} />
            <spotLight position={[10, 20, 10]} angle={0.5} penumbra={1} intensity={2} color="#FFD700" castShadow />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#046307" />

            <Environment preset="city" />

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

            <ContactShadows opacity={0.5} scale={40} blur={2} far={10} resolution={256} color="#000000" position={[0, -10, 0]} />

            <OrbitControls 
                enablePan={false} 
                autoRotate={state === TreeMorphState.TREE_SHAPE} 
                autoRotateSpeed={0.5}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.8}
                maxDistance={60}
                minDistance={10}
            />

            {/* Fixed: Removed non-existent property 'disableNormalPass' */}
            <EffectComposer>
                <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5} radius={0.6} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;
