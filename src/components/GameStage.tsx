/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Webcam from 'react-webcam';
import type { Hands, Results } from '@mediapipe/hands';
import { GameObject, GameState, Particle } from '../types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  GRAVITY, 
  SPAWN_RATE, 
  FRUIT_CONFIG, 
  getRandomArbitrary, 
  getDistance 
} from '../constants';

interface GameStageProps {
  gameState: GameState;
  onScoreChange: (score: number) => void;
  onGameOver: () => void;
}

export default function GameStage({ gameState, onScoreChange, onGameOver }: GameStageProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const lastScoreRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Game Logic Refs
  const objectsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const fingerPosRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedFingerRef = useRef<{ x: number; y: number } | null>(null);
  const isProcessingRef = useRef(false);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // On mobile use viewport so items fill the whole screen; desktop keeps fixed 1280×720
  const { canvasW, canvasH } = useMemo(() => {
    const mobile = window.innerWidth < 768;
    return {
      canvasW: mobile ? window.innerWidth : GAME_WIDTH,
      canvasH: mobile ? window.innerHeight : GAME_HEIGHT,
    };
  }, []);

  // Initialize MediaPipe Hands
  useEffect(() => {
    async function setupHands() {
      // In this environment, we might need to load from CDN for reliability if Local fails
      // But we'll try the direct import first
      const handsMod = await import('@mediapipe/hands');
      const hands = new handsMod.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results: Results) => {
        if (!isLoaded) setIsLoaded(true);
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          // Index finger tip is index 8
          const indexFinger = landmarks[8];
          const raw = {
            x: (1 - indexFinger.x) * canvasW,
            y: indexFinger.y * canvasH,
          };
          // Adaptive EMA: fast movement gets high alpha (responsive), slow gets low (smooth)
          const prev = smoothedFingerRef.current;
          const dist = prev ? Math.hypot(raw.x - prev.x, raw.y - prev.y) : 0;
          const alpha = Math.min(0.95, 0.4 + dist / 150);
          smoothedFingerRef.current = prev
            ? { x: alpha * raw.x + (1 - alpha) * prev.x, y: alpha * raw.y + (1 - alpha) * prev.y }
            : raw;
          fingerPosRef.current = smoothedFingerRef.current;

          trailRef.current.push({
            ...fingerPosRef.current,
            time: Date.now()
          });
        } else {
          fingerPosRef.current = null;
          smoothedFingerRef.current = null;
        }
      });

      handsRef.current = hands;
    }

    setupHands();

    return () => {
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []);

  // Frame Processing Loop for MediaPipe
  useEffect(() => {
    let interval: number;

    const processVideo = async () => {
      if (
        !isProcessingRef.current &&
        webcamRef.current?.video?.readyState === 4 &&
        handsRef.current
      ) {
        isProcessingRef.current = true;
        try {
          await handsRef.current.send({ image: webcamRef.current.video });
        } catch (e) {
          console.error("Hands processing error", e);
        }
        isProcessingRef.current = false;
      }
      interval = requestAnimationFrame(processVideo);
    };

    processVideo();
    return () => cancelAnimationFrame(interval);
  }, []);

  const spawnObject = useCallback(() => {
    const types: ('fruit' | 'candy' | 'bomb')[] = ['fruit', 'fruit', 'fruit', 'candy', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = FRUIT_CONFIG[type];

    const newObject: GameObject = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      x: getRandomArbitrary(canvasW * 0.05, canvasW * 0.95),
      y: canvasH + 50,
      vx: getRandomArbitrary(-2, 2),
      vy: getRandomArbitrary(-12, -18),
      radius: canvasW < GAME_WIDTH
        ? (type === 'bomb' ? 38 : 32)
        : (type === 'bomb' ? 52 : 45),
      rotation: 0,
      rotationSpeed: getRandomArbitrary(-0.1, 0.1),
      color: config.color,
      emoji: config.emoji,
      isPopped: false,
    };

    objectsRef.current.push(newObject);
  }, []);

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        id: Math.random().toString(36).substring(2, 11),
        x,
        y,
        vx: getRandomArbitrary(-5, 5),
        vy: getRandomArbitrary(-5, 5),
        life: 1.0,
        color,
      });
    }
  };

  const update = useCallback((time: number) => {
    if (gameState.isGameOver || gameState.isPaused) return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    lastTimeRef.current = time;

    // Spawning
    if (Math.random() < SPAWN_RATE) {
      spawnObject();
    }

    // Update Trail
    const now = Date.now();
    trailRef.current = trailRef.current.filter(p => now - p.time < 300);

    // Update Particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += GRAVITY * 0.5;
      p.life -= 0.02;
      return p.life > 0;
    });

    // Update Objects
    objectsRef.current = objectsRef.current.filter(obj => {
      obj.x += obj.vx;
      obj.y += obj.vy;
      obj.vy += GRAVITY;
      obj.rotation += obj.rotationSpeed;

      // Sweep collision: check all trail points from last 80ms to catch fast swipes
      if (!obj.isPopped) {
        const sweepPoints = trailRef.current.filter(p => now - p.time < 80);
        if (fingerPosRef.current) sweepPoints.push({ ...fingerPosRef.current, time: now });
        for (const point of sweepPoints) {
          const dist = getDistance(point.x, point.y, obj.x, obj.y);
          if (dist < obj.radius + 20) {
            if (obj.type === 'bomb') {
              onGameOver();
            } else {
              obj.isPopped = true;
              createExplosion(obj.x, obj.y, obj.color);
              lastScoreRef.current += FRUIT_CONFIG[obj.type].value;
              onScoreChange(lastScoreRef.current);
            }
            break;
          }
        }
      }

      // Return true if object is still on screen and not popped
      return obj.y < canvasH + 100 && !obj.isPopped;
    });
  }, [gameState.isGameOver, gameState.isPaused, onGameOver, onScoreChange, spawnObject]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Draw Trail
    if (trailRef.current.length > 2) {
      ctx.beginPath();
      ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
      for (let i = 1; i < trailRef.current.length; i++) {
        const point = trailRef.current[i];
        ctx.lineTo(point.x, point.y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inner trail
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life * 0.8;
      ctx.fillStyle = Math.random() > 0.5 ? '#c5a059' : '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Objects
    objectsRef.current.forEach(obj => {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);
      
      // Shadow
      ctx.shadowBlur = 15;
      ctx.shadowColor = obj.color;
      
      ctx.font = `${obj.radius * 1.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.emoji, 0, 0);
      
      ctx.restore();
    });

    // Draw Finger Indicator
    if (fingerPosRef.current) {
        const dotRadius = 8;
        ctx.beginPath();
        ctx.arc(fingerPosRef.current.x, fingerPosRef.current.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#c5a059';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#c5a059';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    requestRef.current = requestAnimationFrame((time) => {
      update(time);
      draw();
    });
  }, [update]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(requestRef.current);
  }, [draw]);

  // Reset score ref on game restart
  useEffect(() => {
    if (!gameState.isGameOver) {
      lastScoreRef.current = gameState.score;
      if (gameState.score === 0) {
        objectsRef.current = [];
        particlesRef.current = [];
      }
    }
  }, [gameState.isGameOver, gameState.score]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* Background Dimmer Layer */}
      <div className="absolute inset-0 bg-black/35 z-[5]" />
      
      {!isLoaded && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#080808]">
           <div className="text-center">
              <div className="w-12 h-12 border border-[#c5a059]/30 border-t-[#c5a059] rounded-full animate-spin mx-auto mb-6" />
              <div className="text-[#c5a059] font-serif italic text-lg tracking-widest animate-pulse">
                Calibrating Neural Interface...
              </div>
           </div>
        </div>
      )}
      
      <Webcam
        ref={webcamRef as any}
        mirrored
        audio={false}
        videoConstraints={{
          width: { ideal: canvasW },
          height: { ideal: canvasH },
          facingMode: "user"
        }}
        {...({
           className: `absolute inset-0 w-full h-full ${canvasW < GAME_WIDTH ? 'object-cover' : 'object-contain'} opacity-60 brightness-[1.1] contrast-[1.1]`
        } as any)}
      />
      
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        className="relative z-10 w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}
