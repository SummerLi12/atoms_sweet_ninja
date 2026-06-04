/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Play, Pause, CameraOff, Sparkles, Bomb, Info } from 'lucide-react';
import { GameState } from './types';
import GameStage from './components/GameStage';
import TraceabilityOverlay from './components/TraceabilityOverlay';
import { cn } from './lib/utils';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isGameOver: false,
    isPaused: false,
    bestScore: 0,
    combo: 0,
    shake: 0,
  });

  const [gameStarted, setGameStarted] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    let timer: number;
    if (gameState.shake > 0) {
      timer = window.setInterval(() => {
        setGameState(prev => ({ ...prev, shake: Math.max(0, prev.shake - 1) }));
      }, 50);
    }
    return () => clearInterval(timer);
  }, [gameState.shake]);

  useEffect(() => {
    const saved = localStorage.getItem('sweet-ninja-best-score');
    if (saved) {
      setGameState(prev => ({ ...prev, bestScore: parseInt(saved, 10) }));
    }
  }, []);

  const handleScoreChange = useCallback((newScore: number, isHit: boolean) => {
    setGameState(prev => {
      const newCombo = isHit ? prev.combo + 1 : 0;
      const best = Math.max(prev.bestScore, newScore);
      if (best > prev.bestScore) {
        localStorage.setItem('sweet-ninja-best-score', best.toString());
      }
      return { 
        ...prev, 
        score: newScore, 
        bestScore: best,
        combo: newCombo
      };
    });
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState(prev => ({ ...prev, isGameOver: true, shake: 20 }));
  }, []);

  const restartGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      isGameOver: false,
      isPaused: false,
      combo: 0,
      shake: 0,
    }));
  }, []);

  const startGame = () => setGameStarted(true);

  return (
    <div className="relative w-full h-screen bg-[#080808] overflow-hidden font-sans select-none text-gray-200">
      {/* Sophisticated Atmosphere */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#c5a059] rounded-full blur-[200px] -mr-[20%] -mt-[10%]" />
      </div>

      <AnimatePresence>
        {!gameStarted ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#080808]/90 backdrop-blur-sm"
          >
            <div className="flex w-full h-full">
<main className="flex-1 flex flex-col items-center justify-center p-12">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="max-w-xl w-full text-center"
                >
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-[0.4em] text-[#c5a059] font-semibold mb-2">V-Model System Overlay v.2.6</p>
                    <h1 className="text-8xl font-light tracking-tighter text-white mb-6 italic font-serif">
                      Sweet Ninja
                    </h1>
                    <div className="h-[1px] w-32 bg-[#c5a059]/40 mx-auto mb-8" />
                  </div>
                  
                  <p className="text-gray-400 mb-12 leading-relaxed text-lg font-light max-w-md mx-auto">
                    A refined blade-simulation for the modern shinobi. 
                    Precision tracking, absolute focus.
                  </p>
                  
                  <button
                    onClick={startGame}
                    className="group relative px-12 py-5 bg-[#c5a059] text-black font-bold text-sm tracking-[0.3em] uppercase transition-all hover:bg-[#d4b57a] hover:scale-105 active:scale-95 flex items-center gap-4 mx-auto"
                  >
                    <Play size={18} fill="black" /> Initiate Session
                  </button>

                  <div className="mt-16 grid grid-cols-3 gap-6 opacity-40">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Hand Detection : Active</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Latency : &lt;12ms</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Mode : Enterprise</div>
                  </div>
                </motion.div>
              </main>
            </div>
          </motion.div>
        ) : (
          <div className={cn(
            "absolute inset-0 z-10 transition-transform duration-75",
            gameState.shake > 0 && "translate-x-1 translate-y-1"
          )}
          style={{
            transform: gameState.shake > 0 
              ? `translate(${(Math.random() - 0.5) * gameState.shake * 2}px, ${(Math.random() - 0.5) * gameState.shake * 2}px)` 
              : 'none'
          }}
          >
            <GameStage 
              gameState={gameState}
              onScoreChange={(score) => handleScoreChange(score, true)}
              onGameOver={handleGameOver}
            />

            <TraceabilityOverlay isOpen={showTrace} />
            
            {/* Header / HUD Overlay */}
            <div className="absolute top-0 left-0 right-0 h-24 border-b border-white/10 flex items-center justify-between px-12 pointer-events-none z-20 bg-[#080808]/40 backdrop-blur-md">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setShowTrace(!showTrace)}
                  className="p-3 bg-white/5 border border-white/10 rounded-full pointer-events-auto hover:bg-[#c5a059]/20 transition-colors group"
                >
                  <Info className={cn("w-5 h-5", showTrace ? "text-[#c5a059]" : "text-gray-400 group-hover:text-white")} />
                </button>
                <div>
                  <h2 className="text-xl font-serif italic text-white leading-none">Sweet Ninja</h2>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#c5a059] font-bold mt-1">Operational Environment</p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                {gameState.combo > 1 && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    key={gameState.combo}
                    className="text-right"
                  >
                     <div className="text-[10px] uppercase tracking-widest text-[#c5a059] mb-1">Strike Combo</div>
                     <div className="text-3xl font-light text-white leading-none italic font-serif">x{gameState.combo}</div>
                  </motion.div>
                )}

                <div className="text-right min-w-[120px]">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Session Yield</p>
                  <p className="text-3xl font-light text-white leading-none tabular-nums font-mono">{gameState.score}</p>
                </div>

                <div className="h-8 w-[1px] bg-white/10" />

                <div className="text-right min-w-[80px]">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Peak</p>
                  <p className="text-xl font-light text-gray-400 leading-none tabular-nums font-mono">{gameState.bestScore}</p>
                </div>
              </div>
            </div>

            {/* Game Over Screen */}
            <AnimatePresence>
              {gameState.isGameOver && (
                <motion.div
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                  className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 pointer-events-auto"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-md w-full bg-[#121212] border border-white/5 p-12 text-center shadow-2xl relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[#c5a059]" />
                    
                    <div className="inline-flex p-5 bg-[#c5a059]/10 rounded-full mb-8">
                      <Bomb className="w-10 h-10 text-[#c5a059]" />
                    </div>
                    
                    <h2 className="text-4xl font-serif italic text-white mb-2 tracking-tight">
                      Session Terminated
                    </h2>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c5a059] font-semibold mb-10">High Volatility Detected</p>
                    
                    <div className="grid grid-cols-1 gap-px bg-white/10 border border-white/10 mb-10">
                       <div className="bg-[#121212] p-6 text-left">
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Final Performance</div>
                          <div className="text-4xl font-light text-white font-mono">{gameState.score}</div>
                       </div>
                       <div className="bg-[#121212] p-6 text-left border-t border-white/5">
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Portfolio Best</div>
                          <div className="text-2xl font-light text-gray-400 font-mono">{gameState.bestScore}</div>
                       </div>
                    </div>

                    <button
                      onClick={restartGame}
                      className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black font-bold uppercase tracking-[0.3em] text-xs transition-all hover:bg-[#c5a059] hover:scale-105 active:scale-95"
                    >
                      <RefreshCw size={14} /> Re-Initialize Session
                    </button>
                    
                    <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-widest">
                      Traceability ID: #ST-4 · Game Logic Subsystem
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
