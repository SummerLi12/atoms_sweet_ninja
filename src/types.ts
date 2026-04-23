/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameObjectType = 'fruit' | 'candy' | 'bomb';

export interface GameObject {
  id: string;
  type: GameObjectType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  emoji: string;
  isPopped: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface GameState {
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
  bestScore: number;
  combo: number;
  shake: number;
}
