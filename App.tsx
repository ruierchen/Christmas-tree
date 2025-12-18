
import React, { useState, useEffect, useRef } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import HandTracker from './components/HandTracker';
import { TreeMorphState, PhotoFrameData, HandData } from './types';
import { CONFIG } from './constants';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);
  const [photos, setPhotos] = useState<PhotoFrameData[]>([]);
  const [focusedPhoto, setFocusedPhoto] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [handData, setHandData] = useState<HandData>({ x: 0, y: 0, gesture: 'NONE', isPresent: false });
  
  const lastGestureRef = useRef<string>('NONE');

  // Load shared data
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#tree=')) {
      try {
        const encodedData = hash.replace('#tree=', '');
        const decodedData = JSON.parse(atob(decodeURIComponent(encodedData)));
        if (Array.isArray(decodedData)) {
          setPhotos(decodedData);
          setTreeState(TreeMorphState.TREE_SHAPE);
        }
      } catch (e) {
        console.error("Shared data parse error", e);
      }
    }
  }, []);

  // Gesture handling
  useEffect(() => {
    if (!handData.isPresent) return;

    if (handData.gesture !== lastGestureRef.current) {
      if (handData.gesture === 'OPEN') {
        setTreeState(TreeMorphState.SCATTERED);
        setFocusedPhoto(null);
      } else if (handData.gesture === 'FIST') {
        setTreeState(TreeMorphState.TREE_SHAPE);
        setFocusedPhoto(null);
      } else if (handData.gesture === 'PINCH') {
        if (photos.length > 0) {
          const randomIdx = Math.floor(Math.random() * photos.length);
          setFocusedPhoto(photos[randomIdx].url);
        }
      }
      lastGestureRef.current = handData.gesture;
    }
  }, [handData, photos]);

  const handlePhotoUpload = (url: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const h = CONFIG.TREE_HEIGHT;
    const y = (Math.random() * 0.8 * h) - (h * 0.4);
    const yNorm = (y + h/2) / h;
    const radius = CONFIG.TREE_RADIUS_BASE * (1.0 - yNorm) * 1.1;
    const angle = Math.random() * Math.PI * 2;
    const treePos: [number, number, number] = [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
    const rS = CONFIG.SCATTER_RADIUS * (0.6 + Math.random() * 0.4);
    const tS = Math.random() * Math.PI * 2;
    const pS = Math.acos(2 * Math.random() - 1);
    const scatterPos: [number, number, number] = [rS * Math.sin(pS) * Math.cos(tS), rS * Math.sin(pS) * Math.sin(tS), rS * Math.cos(pS)];
    const rotation: [number, number, number] = [0, -angle + Math.PI/2, 0];
    const newPhoto = { id, url, treePos, scatterPos, rotation };
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const handleShare = () => {
    if (photos.length === 0) return;
    try {
      const serialized = btoa(JSON.stringify(photos));
      const shareUrl = `${window.location.origin}${window.location.pathname}#tree=${encodeURIComponent(serialized)}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      });
    } catch (e) {
      alert("Tree too large to share via link.");
    }
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden font-sans">
      <Scene 
        state={treeState} 
        photos={photos} 
        onPhotoClick={setFocusedPhoto}
        handRotation={[handData.y * 0.5, handData.x * 0.5]}
      />
      
      <HandTracker onHandUpdate={setHandData} />

      <UIOverlay 
        currentState={treeState} 
        onStateChange={setTreeState}
        onPhotoUpload={handlePhotoUpload}
        photos={photos}
        onPhotoDelete={(id) => setPhotos(p => p.filter(x => x.id !== id))}
        onShare={handleShare}
      />

      {/* Cinematic Polaroid Modal */}
      {focusedPhoto && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in" onClick={() => setFocusedPhoto(null)}>
          <div className="relative p-3 bg-white shadow-[0_0_100px_rgba(255,215,0,0.4)] rotate-[-2deg] transition-transform hover:rotate-0" onClick={e => e.stopPropagation()}>
             <button onClick={() => setFocusedPhoto(null)} className="absolute -top-12 -right-12 p-3 bg-arix-gold text-arix-emerald rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <div className="bg-black overflow-hidden border border-gray-100">
               <img src={focusedPhoto} alt="Arix Memory" className="max-w-[80vw] max-h-[70vh] object-contain" />
             </div>
             <div className="pt-6 pb-2 text-center">
                <p className="font-serif italic text-gray-800 text-2xl tracking-tight">Signature Memory</p>
                <p className="text-[10px] text-gray-400 mt-2 font-display uppercase tracking-widest">Arix Grand Luxury Collection</p>
             </div>
          </div>
        </div>
      )}

      {/* Control Hint */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col gap-8 pointer-events-none opacity-40">
        <div className={`flex items-center gap-4 transition-all ${handData.gesture === 'OPEN' ? 'scale-125 opacity-100 text-arix-gold' : ''}`}>
          <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center font-display text-xs">OPEN</div>
          <span className="text-xs tracking-widest uppercase">Scatter</span>
        </div>
        <div className={`flex items-center gap-4 transition-all ${handData.gesture === 'FIST' ? 'scale-125 opacity-100 text-arix-gold' : ''}`}>
          <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center font-display text-xs">FIST</div>
          <span className="text-xs tracking-widest uppercase">Assemble</span>
        </div>
        <div className={`flex items-center gap-4 transition-all ${handData.gesture === 'PINCH' ? 'scale-125 opacity-100 text-arix-gold' : ''}`}>
          <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center font-display text-xs">PINCH</div>
          <span className="text-xs tracking-widest uppercase">Focus</span>
        </div>
      </div>

      {showShareToast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-arix-gold text-arix-emerald px-8 py-3 rounded-full font-serif font-bold shadow-2xl animate-slide-up">
          ✨ Share Link Copied to Clipboard ✨
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slide-up { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;

