export type CharacterId = 'player' | 'rook' | 'mina' | 'pip' | 'vale' | 'nox' | 'kira';

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  color: number; // Primary body color
  colorHex: string;
  accentColor: number; // Secondary shell/shading color
  eyeColor: number;
  spawnRoom: string;
  spawnX: number;
  spawnY: number;
  speed: number;
  patrolRadius?: number;
  isPlayer?: boolean;
}

export interface ColonyRoom {
  id: string;
  name: string;
  x: number; // Grid tile coordinate (top-left)
  y: number;
  width: number; // in tiles
  height: number;
  colorTheme: number;
  labelX: number;
  labelY: number;
}

export interface TaskDefinition {
  id: string;
  name: string;
  room: string;
  x: number; // World pixel coordinates
  y: number;
  isCompleted: boolean;
}
