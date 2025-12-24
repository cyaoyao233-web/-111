import React, { useState, Suspense } from 'react';
import { Scene } from './components/Scene';
import { TreeState } from './types';
import { Loader } from '@react-three/drei';

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.SCATTERED);

  const cycleState = () => {
    setTreeState((prev) => {
        if (prev === TreeState.SCATTERED) return TreeState.TREE_SHAPE;
        return TreeState.SCATTERED;
    });
  };

  const getButtonText = () => {
      switch(treeState) {
          case TreeState.SCATTERED: return 'ASSEMBLE TREE';
          case TreeState.TREE_SHAPE: return 'DISPERSE';
          default: return 'INTERACT';
      }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Canvas */}
      <Suspense fallback={null}>
        <Scene treeState={treeState} />
      </Suspense>
      <Loader />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-16 z-10">
        
        {/* Header / Branding */}
        <header className="flex flex-col items-start space-y-2">
            <h2 className="text-amber-400 text-xs tracking-[0.3em] uppercase font-sans">YOYO PRESENTS</h2>
            <h1 className="text-5xl md:text-7xl text-white font-serif italic drop-shadow-[0_0_25px_rgba(255,215,0,0.6)]">
                Merry<br/>Christmas
            </h1>
        </header>

        {/* Footer / Controls */}
        <div className="flex flex-col items-center md:items-end space-y-6">
            <div className="text-white/60 text-sm max-w-xs text-center md:text-right font-light font-sans tracking-wide">
                <p>鸡公煲鸡公煲，进过我的胃。</p>
            </div>
            
            <button 
                onClick={cycleState}
                className="pointer-events-auto group relative px-10 py-5 bg-transparent overflow-hidden rounded-none transition-all duration-500 ease-out hover:scale-105"
            >
                {/* Custom Border Effect */}
                <div className="absolute inset-0 border border-amber-500/30 group-hover:border-amber-400 transition-colors duration-500" />
                <div className="absolute inset-[2px] border border-amber-500/10 group-hover:border-amber-400/50 transition-colors duration-500" />
                
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/0 via-amber-900/30 to-amber-900/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <span className="relative z-10 font-serif text-xl md:text-2xl text-amber-100 tracking-widest group-hover:text-white transition-colors duration-300">
                    {getButtonText()}
                </span>
            </button>
        </div>
      </div>
      
      {/* Decorative Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] mix-blend-multiply" />
    </div>
  );
}

export default App;