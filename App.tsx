
import React, { useState, useMemo } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import { TreeMorphState, PhotoFrameData } from './types';
import { CONFIG } from './constants';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);
  const [photos, setPhotos] = useState<PhotoFrameData[]>([]);
  const [focusedPhoto, setFocusedPhoto] = useState<string | null>(null);

  const handlePhotoUpload = (url: string) => {
    // Generate positions for the new frame
    const id = Math.random().toString(36).substr(2, 9);
    
    // Tree Position: On the surface of the cone
    const h = CONFIG.TREE_HEIGHT;
    const y = (Math.random() * 0.8 * h) - (h * 0.4);
    const yNorm = (y + h/2) / h;
    const radius = CONFIG.TREE_RADIUS_BASE * (1.0 - yNorm) * 1.1; // Slightly offset from foliage
    const angle = Math.random() * Math.PI * 2;
    
    const treePos: [number, number, number] = [
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
    ];

    // Scatter Position: Random in wide space
    const rS = CONFIG.SCATTER_RADIUS * (0.6 + Math.random() * 0.4);
    const tS = Math.random() * Math.PI * 2;
    const pS = Math.acos(2 * Math.random() - 1);
    const scatterPos: [number, number, number] = [
        rS * Math.sin(pS) * Math.cos(tS),
        rS * Math.sin(pS) * Math.sin(tS),
        rS * Math.cos(pS)
    ];

    const rotation: [number, number, number] = [0, -angle + Math.PI/2, 0];

    const newPhoto: PhotoFrameData = { id, url, treePos, scatterPos, rotation };
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const handlePhotoDelete = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <Scene 
        state={treeState} 
        photos={photos} 
        onPhotoClick={setFocusedPhoto}
      />
      
      <UIOverlay 
        currentState={treeState} 
        onStateChange={setTreeState}
        onPhotoUpload={handlePhotoUpload}
        photos={photos}
        onPhotoDelete={handlePhotoDelete}
      />

      {/* Cinematic Photo Zoom Modal */}
      {focusedPhoto && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md cursor-zoom-out animate-fade-in"
          onClick={() => setFocusedPhoto(null)}
        >
          <div 
            className="relative p-1 bg-arix-gold shadow-[0_0_100px_rgba(255,215,0,0.4)] max-w-[90vw] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
             <button 
               onClick={() => setFocusedPhoto(null)}
               className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-arix-gold hover:text-white rounded-full backdrop-blur-md transition-all hover:scale-110"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>

             <img 
               src={focusedPhoto} 
               alt="Arix Memory" 
               className="max-w-full max-h-[85vh] object-contain block" 
             />
             
             <div className="p-4 bg-arix-emerald text-center">
                <p className="font-display text-arix-gold tracking-[0.3em] text-sm mb-1 uppercase">Arix Signature Memory</p>
                <p className="font-serif italic text-arix-goldDim text-xs">Captured in Brilliance</p>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
