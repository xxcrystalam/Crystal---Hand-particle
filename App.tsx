import React, { useState, useRef, useCallback, useEffect } from 'react';
import Scene from './components/Scene';
import HandTracker from './components/HandTracker';
import { ParticleConfig, ShapeType, HandData } from './types';
import { Sliders, Maximize, Palette, Sparkles, Hand, Loader2, Star, Heart, Activity, Box, Circle, Disc, Zap, CloudFog } from 'lucide-react';

const COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#ffff00', // Yellow
  '#ff4400', // Orange Red
  '#ffffff', // White
  '#00ff00', // Lime
  '#7000ff', // Deep Purple
  '#ff0066', // Hot Pink
];

const SHAPE_ICONS: Record<string, React.ReactNode> = {
  [ShapeType.SPHERE]: <Circle className="w-4 h-4" />,
  [ShapeType.CUBE]: <Box className="w-4 h-4" />,
  [ShapeType.TORUS]: <Disc className="w-4 h-4" />,
  [ShapeType.DNA]: <Activity className="w-4 h-4" />,
  [ShapeType.STAR]: <Star className="w-4 h-4" />,
  [ShapeType.GALAXY]: <Sparkles className="w-4 h-4" />,
  [ShapeType.NEBULA]: <CloudFog className="w-4 h-4" />,
  [ShapeType.HEART]: <Heart className="w-4 h-4" />,
  [ShapeType.FIREWORKS]: <Zap className="w-4 h-4" />,
};

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>({
    count: 6000,
    color: '#00ffff',
    size: 0.05,
    shape: ShapeType.STAR,
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [handDebug, setHandDebug] = useState(false);
  const [showUi, setShowUi] = useState(true);
  
  // Ref to store latest hand data without triggering re-renders
  const handDataRef = useRef<HandData>({
    factor: 0.6,
    x: 0,
    y: 0,
    isTracking: false,
    gesture: 'None'
  });

  const handleHandUpdate = useCallback((data: HandData) => {
    handDataRef.current = data;
    
    // Simple gesture trigger logic (with basic debouncing via state check)
    // We only trigger if the config isn't already set to that shape to avoid loop
    if (data.gesture === 'Victory') {
       setConfig(prev => prev.shape !== ShapeType.HEART ? { ...prev, shape: ShapeType.HEART } : prev);
    }
  }, []);

  const handleShapeChange = (shape: ShapeType) => {
    setConfig(prev => ({ ...prev, shape }));
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setConfig(prev => ({ ...prev, shape: ShapeType.AI_GENERATED, aiPrompt }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-white bg-black selection:bg-cyan-500/30">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Scene particleConfig={config} handDataRef={handDataRef} setLoading={setIsAiLoading} />
      </div>

      {/* Hand Tracker (Hidden or PIP) */}
      <HandTracker onHandUpdate={handleHandUpdate} debugMode={handDebug} />

      {/* Loading Overlay */}
      {isAiLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity">
          <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
              Generating Model
            </h2>
            <p className="text-gray-400 mt-2 text-sm">Gemini is calculating 3D coordinates...</p>
          </div>
        </div>
      )}

      {/* UI Toggle Button */}
      <button 
        onClick={() => setShowUi(!showUi)}
        className="absolute top-6 right-6 z-40 p-3 bg-black/40 hover:bg-white/10 backdrop-blur-lg border border-white/10 rounded-full transition-all duration-300 hover:scale-105"
      >
        <Sliders className="w-5 h-5 text-cyan-300" />
      </button>

      {/* Main UI Panel */}
      <div className={`absolute top-0 left-0 h-full w-96 bg-gradient-to-b from-black/80 via-black/60 to-black/80 backdrop-blur-xl border-r border-white/10 z-30 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) p-8 flex flex-col gap-8 overflow-y-auto ${showUi ? 'translate-x-0' : '-translate-x-full'} shadow-[10px_0_30px_rgba(0,0,0,0.5)]`}>
        
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full"></div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Particle<span className="text-cyan-400">Core</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-4">Interactive 3D System</p>
        </div>

        {/* Hand Control Status */}
        <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Hand className="w-16 h-16 text-white" />
          </div>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-cyan-300">
            <Activity className="w-4 h-4" /> Gesture Control
          </h3>
          <div className="space-y-3 text-xs text-gray-300">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
              <span><strong>Move Hand:</strong> Rotate Scene</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
              <span><strong>Open/Close:</strong> Expand/Contract</span>
            </div>
             <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></span>
              <span><strong>Victory Sign:</strong> Switch to Heart</span>
            </div>
          </div>
        </div>

        {/* Shape Selector */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Select Pattern
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[ShapeType.STAR, ShapeType.GALAXY, ShapeType.NEBULA, ShapeType.HEART, ShapeType.FIREWORKS, ShapeType.SPHERE, ShapeType.CUBE, ShapeType.DNA, ShapeType.TORUS].map((shape) => (
              <button
                key={shape}
                onClick={() => handleShapeChange(shape)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all border overflow-hidden ${
                  config.shape === shape 
                    ? 'bg-cyan-500/10 border-cyan-400/50 text-cyan-200' 
                    : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <div className={`transition-transform duration-300 ${config.shape === shape ? 'scale-110' : 'group-hover:scale-110'}`}>
                   {SHAPE_ICONS[shape]}
                </div>
                <span className="text-xs font-medium">{shape}</span>
                {config.shape === shape && (
                  <div className="absolute inset-0 bg-cyan-400/5 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-3 h-3" /> Visual Style
          </label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setConfig(prev => ({ ...prev, color: c }))}
                className={`relative w-8 h-8 rounded-full transition-all duration-300 ${
                  config.color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-105 opacity-60 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: c,
                  boxShadow: config.color === c ? `0 0 15px ${c}` : 'none'
                }}
              />
            ))}
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-white/50 transition-colors">
              <input 
                type="color" 
                value={config.color}
                onChange={(e) => setConfig(prev => ({...prev, color: e.target.value}))}
                className="absolute inset-[-4px] w-[150%] h-[150%] p-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* AI Generator */}
        <div className="space-y-3 pt-4 border-t border-white/10">
           <label className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-purple-400" /> AI Generator
          </label>
          <form onSubmit={handleAiSubmit} className="space-y-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Describe a shape..." 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500/50 focus:bg-white/5 text-white placeholder-gray-600 transition-all"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={isAiLoading || !aiPrompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
            >
              Generate with Gemini
            </button>
          </form>
        </div>

        {/* Particle Count */}
        <div className="space-y-3 pt-2">
           <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
             <span>Density</span>
             <span className="text-cyan-400">{config.count}</span>
           </div>
           <input 
             type="range" 
             min="1000" 
             max="15000" 
             step="1000"
             value={config.count}
             onChange={(e) => setConfig(prev => ({...prev, count: parseInt(e.target.value)}))}
             className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
           />
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-8 flex gap-3">
           <button 
             onClick={toggleFullscreen}
             className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium transition-colors border border-white/5"
           >
             <Maximize className="w-3 h-3" /> Fullscreen
           </button>
           <button 
             onClick={() => setHandDebug(!handDebug)}
             className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-colors border ${handDebug ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
           >
             Camera
           </button>
        </div>
      </div>
    </div>
  );
};

export default App;