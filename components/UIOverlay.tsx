
import React, { useState, useRef } from 'react';
import { TreeMorphState, PhotoFrameData } from '../types';

interface UIOverlayProps {
  currentState: TreeMorphState;
  onStateChange: (state: TreeMorphState) => void;
  onPhotoUpload: (url: string) => void;
  photos: PhotoFrameData[];
  onPhotoDelete: (id: string) => void;
  onShare: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  currentState, 
  onStateChange, 
  onPhotoUpload, 
  photos, 
  onPhotoDelete,
  onShare
}) => {
  const [showManager, setShowManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    onStateChange(currentState === TreeMorphState.SCATTERED ? TreeMorphState.TREE_SHAPE : TreeMorphState.SCATTERED);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoUpload(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <header className="flex justify-between items-start pointer-events-auto">
        <div className="group cursor-default">
          <h1 className="text-4xl md:text-6xl font-display text-arix-gold drop-shadow-lg tracking-widest transition-all group-hover:tracking-[0.3em]">
            ARIX
          </h1>
          <p className="text-arix-goldDim font-serif italic text-lg ml-1">Signature Collection</p>
        </div>
        
        <div className="flex gap-3">
            {photos.length > 0 && (
              <button 
                  onClick={onShare}
                  className="bg-arix-emerald border border-arix-gold text-arix-gold px-4 py-2 rounded-sm font-serif transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center gap-2 hover:bg-arix-gold hover:text-arix-emerald group/share"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform group-hover/share:scale-110">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185zm0 12.814a2.25 2.25 0 103.933 2.185 2.25 2.25 0 00-3.933-2.185z" />
                  </svg>
                  Share Tree
              </button>
            )}

            <button 
                onClick={() => setShowManager(!showManager)}
                className={`bg-arix-glass backdrop-blur-md border border-arix-goldDim text-arix-gold px-4 py-2 rounded-sm font-serif transition-all shadow-lg flex items-center gap-2 ${showManager ? 'bg-arix-gold text-arix-emerald' : 'hover:bg-arix-emerald/40'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                Gallery ({photos.length})
            </button>

            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-arix-gold text-arix-emerald px-6 py-2 rounded-sm font-serif font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]"
            >
                Upload Memory
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
        </div>
      </header>

      {/* Photo Management Panel */}
      {showManager && (
        <div className="absolute top-24 right-6 w-80 max-h-[70vh] pointer-events-auto bg-[#001008]/95 border border-arix-gold backdrop-blur-xl p-4 rounded-lg shadow-2xl overflow-y-auto z-20">
          <div className="flex justify-between items-center mb-4 border-b border-arix-goldDim/30 pb-2">
            <h3 className="text-arix-gold font-display text-sm tracking-widest">MANAGE MEMORIES</h3>
            <button onClick={() => setShowManager(false)} className="text-arix-goldDim hover:text-white">&times;</button>
          </div>
          
          {photos.length === 0 ? (
            <p className="text-arix-goldDim font-serif italic text-sm text-center py-8">No memories uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map(photo => (
                <div key={photo.id} className="relative group aspect-[3/4] bg-black border border-arix-goldDim/30 rounded overflow-hidden">
                  <img src={photo.url} alt="Memory" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <button 
                    onClick={() => onPhotoDelete(photo.id)}
                    className="absolute top-1 right-1 bg-red-900/80 text-white p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Delete Memory"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Control */}
      <div className="flex flex-col items-center w-full pointer-events-auto pb-4">
        <button 
          onClick={handleToggle}
          className="group relative px-12 py-5 bg-arix-glass hover:bg-arix-emerald border border-arix-gold transition-all duration-700 rounded-full overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.15)] hover:shadow-[0_0_50px_rgba(255,215,0,0.3)]"
        >
          <div className="absolute inset-0 w-0 bg-arix-gold transition-all duration-1000 ease-out group-hover:w-full opacity-5"></div>
          <span className="relative font-display text-xl tracking-[0.4em] text-arix-gold transition-all group-hover:scale-110 block">
            {currentState === TreeMorphState.SCATTERED ? 'ASSEMBLE TREE' : 'SCATTER MAGIC'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default UIOverlay;
