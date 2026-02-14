
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type GameState = 'START' | 'PLAYING' | 'QUIZ' | 'GAMEOVER' | 'VICTORY';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isJumping: boolean;
  direction: 'left' | 'right';
}

export interface Lantern {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  questionIndex: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Nian {
  id: number;
  x: number;
  y: number;
  startX: number;
  endX: number;
  speed: number;
  width: number;
  height: number;
  direction: number;
}
