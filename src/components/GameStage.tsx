/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import type { Hands, Results } from '@mediapipe/hands';
import { GameObject, GameState, Particle } from '../types';
import {
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

  // Dynamic canvas size — updated on mount and window resize
  const canvasSizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const update = () => {
      const size = { width: window.innerWidth, height: window.innerHeight };
      canvasSizeRef.current = size;
      setCanvasSize(size);
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Game Logic Refs
  const objectsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const fingerPosRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedFingerRef = useRef<{ x: number; y: number } | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Initialize MediaPipe Hands
  useEffect(() => {
    async function setupHands() {
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
          const indexFinger = landmarks[8];
          const { width, height } = canvasSizeRef.current;
          const raw = {
            x: (1 - indexFinger.x) * width,
            y: indexFinger.y * height,
          };
          const alpha = 0.5;
          const prev = smoothedFingerRef.current;
          smoothedFingerRef.current = prev
            ? { x: alpha * raw.x + (1 - alpha) * prev.x, y: alpha * raw.y + (1 - alpha) * prev.y }
            : raw;
          fingerPosRef.current = smoothedFingerRef.current;

          trailRef.current.push({ ...fingerPosRef.current, time: Date.now() });
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
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4 &&
        handsRef.current
      ) {
        try {
          await handsRef.current.send({ image: webcamRef.current.video });
        } catch (e) {
          console.error("Hands processing error", e);
        }
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
    const { width, height } = canvasSizeRef.current;
    const velScale = height / GAME_HEIGHT;
    const margin = Math.min(80, width * 0.1);
    // Scale radius with screen width, same size for all objects for visual consistency
    const radius = Math.max(30, Math.min(52, width * 0.042));

    const newObject: GameObject = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: getRandomArbitrary(margin, width - margin),
      y: height + 50,
      vx: getRandomArbitrary(-2, 2),
      vy: getRandomArbitrary(-12, -18) * velScale,
      radius,
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
        id: Math.random().toString(36).substr(2, 9),
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

    if (Math.random() < SPAWN_RATE) {
      spawnObject();
    }

    const now = Date.now();
    trailRef.current = trailRef.current.filter((p: { x: number; y: number; time: number }) => now - p.time < 300);

    particlesRef.current = particlesRef.current.filter((p: Particle) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += GRAVITY * 0.5;
      p.life -= 0.02;
      return p.life > 0;
    });

    const { height } = canvasSizeRef.current;

    objectsRef.current = objectsRef.current.filter((obj: GameObject) => {
      obj.x += obj.vx;
      obj.y += obj.vy;
      obj.vy += GRAVITY;
      obj.rotation += obj.rotationSpeed;

      if (fingerPosRef.current && !obj.isPopped) {
        const dist = getDistance(fingerPosRef.current.x, fingerPosRef.current.y, obj.x, obj.y);
        if (dist < obj.radius + 20) {
          if (obj.type === 'bomb') {
            onGameOver();
          } else {
            obj.isPopped = true;
            createExplosion(obj.x, obj.y, obj.color);
            lastScoreRef.current += FRUIT_CONFIG[obj.type].value;
            onScoreChange(lastScoreRef.current);
          }
        }
      }

      return obj.y < height + 100 && !obj.isPopped;
    });
  }, [gameState.isGameOver, gameState.isPaused, onGameOver, onScoreChange, spawnObject]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (trailRef.current.length > 2) {
      ctx.beginPath();
      ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
      for (let i = 1; i < trailRef.current.length; i++) {
        ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life * 0.8;
      ctx.fillStyle = Math.random() > 0.5 ? '#c5a059' : '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    objectsRef.current.forEach(obj => {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);
      ctx.shadowBlur = 15;
      ctx.shadowColor = obj.color;
      ctx.font = `${obj.radius * 1.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.emoji, 0, 0);
      ctx.restore();
    });

    if (fingerPosRef.current) {
      ctx.beginPath();
      ctx.arc(fingerPosRef.current.x, fingerPosRef.current.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#c5a059';
      ctx.shadowBlur = 10;
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
        videoConstraints={{ facingMode: "user" }}
        {...({
          className: "absolute inset-0 w-full h-full object-cover opacity-60 brightness-[1.1] contrast-[1.1]"
        } as any)}
      />

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0 z-10 w-full h-full pointer-events-none"
      />
    </div>
  );
}
