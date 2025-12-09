export enum ShapeType {
  SPHERE = 'Sphere',
  CUBE = 'Cube',
  TORUS = 'Torus',
  DNA = 'DNA Helix',
  STAR = 'Star',
  GALAXY = 'Galaxy',
  NEBULA = 'Nebula',
  HEART = 'Heart',
  FIREWORKS = 'Fireworks',
  AI_GENERATED = 'AI Custom',
}

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
  shape: ShapeType;
  aiPrompt?: string; // If shape is AI_GENERATED
}

export type Coordinates = [number, number, number]; // x, y, z

export interface HandData {
  factor: number; // 0 (closed) to 1 (open)
  x: number;      // -1 (left) to 1 (right)
  y: number;      // -1 (top) to 1 (bottom)
  isTracking: boolean;
  gesture?: string; // 'Victory', 'Open_Palm', 'Closed_Fist', 'None'
}

// Simplified HandLandmarker result structure we care about
export interface HandLandmarkResult {
  landmarks: Coordinates[][];
}