/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameObjectType } from './types';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GRAVITY = 0.15;
export const SPAWN_RATE = 0.02; // Probability per frame

export const FRUIT_CONFIG: Record<GameObjectType, { emoji: string; color: string; value: number }> = {
  fruit: { emoji: '🍎', color: '#ff4d4d', value: 10 },
  candy: { emoji: '🍭', color: '#ff80ff', value: 20 },
  bomb: { emoji: '💣', color: '#ff4500', value: -50 },
};

export function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
