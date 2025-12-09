import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
  debugMode?: boolean;
}

// Standard hand connections (Wrist to fingers, and between joints)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17], [0, 5], [0, 17] // Palm
];

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate, debugMode = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedGesture, setDetectedGesture] = useState<string>('None');

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam();
      } catch (err) {
        console.error("MediaPipe init error:", err);
        setError("Failed to load hand tracking.");
      }
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: 320,
              height: 240,
              facingMode: "user"
            }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", predictWebcam);
            setIsReady(true);
          }
        } catch (err) {
          console.error("Webcam error:", err);
          setError("Camera permission denied.");
        }
      }
    };

    const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;

      // Draw Connections
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ffff'; // Cyan lines for futuristic look
      ctx.beginPath();
      for (const [start, end] of HAND_CONNECTIONS) {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
      }
      ctx.stroke();

      // Draw Joints
      ctx.fillStyle = '#ff00ff'; // Magenta joints
      for (const p of landmarks) {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !handLandmarker) return;

      const startTimeMs = performance.now();
      
      if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          // Sync Canvas Size
          if (canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            // Draw on Canvas
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) drawLandmarks(ctx, landmarks);
            }

            // 1. Calculate "Openness"
            const wrist = landmarks[0];
            const tips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
            
            let totalDist = 0;
            tips.forEach(idx => {
              const tip = landmarks[idx];
              const dist = Math.sqrt(
                Math.pow(tip.x - wrist.x, 2) + 
                Math.pow(tip.y - wrist.y, 2) + 
                Math.pow(tip.z - wrist.z, 2)
              );
              totalDist += dist;
            });
            
            const avgDist = totalDist / 5;
            const minOpen = 0.15;
            const maxOpen = 0.45;
            
            let factor = (avgDist - minOpen) / (maxOpen - minOpen);
            factor = Math.max(0, Math.min(1, factor));

            // 2. Calculate Position (X, Y)
            const centerPoint = landmarks[9]; // Middle Finger MCP
            const handX = (0.5 - centerPoint.x) * 3.0; 
            const handY = (0.5 - centerPoint.y) * 3.0; 

            // 3. Gesture Recognition
            let gesture = 'None';
            
            // Helper to check if finger is extended
            const isFingerOpen = (tipIdx: number, pipIdx: number) => {
              const dTip = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y);
              const dPip = Math.hypot(landmarks[pipIdx].x - wrist.x, landmarks[pipIdx].y - wrist.y);
              return dTip > dPip;
            };

            const indexOpen = isFingerOpen(8, 6);
            const middleOpen = isFingerOpen(12, 10);
            const ringOpen = isFingerOpen(16, 14);
            const pinkyOpen = isFingerOpen(20, 18);

            if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
              gesture = 'Victory';
            } else if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
               gesture = 'Closed_Fist';
            } else if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
               gesture = 'Open_Palm';
            }

            setDetectedGesture(gesture);

            onHandUpdate({ 
              factor, 
              x: handX, 
              y: handY,
              isTracking: true,
              gesture
            });

          } else {
             onHandUpdate({ 
               factor: 0.8, 
               x: 0, 
               y: 0, 
               isTracking: false,
               gesture: 'None'
             });
             setDetectedGesture('None');
          }
      }
      
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
      }
    };
  }, [onHandUpdate]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
       <div className={`relative overflow-hidden rounded-lg border border-gray-700 bg-black/50 backdrop-blur-md`}>
         {error && <div className="p-2 text-xs text-red-500">{error}</div>}
         
         {/* Video Feed */}
         <video 
           ref={videoRef}
           autoPlay 
           playsInline
           muted
           className={`h-32 w-40 object-cover transform -scale-x-100 ${debugMode ? 'block' : 'opacity-60 hover:opacity-100'}`}
         />

         {/* Canvas Overlay for Landmarks */}
         <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none ${debugMode ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
         />

         {/* Status Overlay */}
         <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-mono uppercase">
              Tracking
            </span>
            {detectedGesture !== 'None' && (
              <span className="bg-cyan-500/80 px-1.5 py-0.5 rounded text-[10px] text-white font-bold animate-pulse">
                {detectedGesture}
              </span>
            )}
         </div>
       </div>
    </div>
  );
};

export default HandTracker;