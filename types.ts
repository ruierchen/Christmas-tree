
export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export type Vector3Array = [number, number, number];

export interface ParticleData {
  scatterPos: Float32Array;
  treePos: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

export enum OrnamentType {
  GIFT = 'GIFT',
  BAUBLE = 'BAUBLE',
  STAR = 'STAR',
  TORUS = 'TORUS',
  ICICLE = 'ICICLE',
}

export interface OrnamentInstance {
  id: number;
  type: OrnamentType;
  scatterPos: Vector3Array;
  treePos: Vector3Array;
  rotation: Vector3Array;
  scale: number;
  color: string;
}

export interface PhotoFrameData {
  id: string;
  url: string;
  treePos: Vector3Array;
  scatterPos: Vector3Array;
  rotation: Vector3Array;
}

// Gemini Types
export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";

export interface ImageGenConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}
