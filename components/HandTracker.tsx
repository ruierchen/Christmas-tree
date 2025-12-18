
import React, { useEffect, useRef } from 'react';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<any>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    let active = true;

    const initMP = async () => {
      // Load MediaPipe from CDN
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
      const { HandLandmarker, FilesetResolver } = vision;
      
      const wasmFileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      landmarkerRef.current = await HandLandmarker.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      if (navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predict);
        }
      }
    };

    const predict = () => {
      if (!active || !videoRef.current || !landmarkerRef.current) return;

      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Hand position for rotation (centered around index finger base)
        const wrist = landmarks[0];
        const x = (wrist.x - 0.5) * 2; 
        const y = (wrist.y - 0.5) * 2;

        // Gesture Detection
        // Open: Distance between thumb tip and pinky tip is large
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const pinkyTip = landmarks[20];
        
        const dist = (p1: any, p2: any) => Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
        
        const openDist = dist(thumbTip, pinkyTip);
        const pinchDist = dist(thumbTip, indexTip);
        
        let gesture: HandData['gesture'] = 'NONE';
        
        if (pinchDist < 0.05) {
          gesture = 'PINCH';
        } else if (openDist > 0.4) {
          gesture = 'OPEN';
        } else {
          gesture = 'FIST';
        }

        onHandUpdate({ x, y, gesture, isPresent: true });
      } else {
        onHandUpdate({ x: 0, y: 0, gesture: 'NONE', isPresent: false });
      }

      requestRef.current = requestAnimationFrame(predict);
    };

    initMP();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 w-32 h-24 border border-arix-gold/30 rounded overflow-hidden opacity-50 z-50 pointer-events-none grayscale">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
      <div className="absolute top-0 left-0 bg-black/50 text-[10px] px-1 text-arix-gold font-display">VISION FEED</div>
    </div>
  );
};

export default HandTracker;
