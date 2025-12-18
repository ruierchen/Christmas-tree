import * as THREE from 'three';

export const COLORS = {
  GOLD: new THREE.Color('#FFD700'),
  GOLD_DIM: new THREE.Color('#B8860B'),
  EMERALD: new THREE.Color('#002A18'),
  EMERALD_LIGHT: new THREE.Color('#046307'),
  WHITE_WARM: new THREE.Color('#FFFDD0'),
  RED_DARK: new THREE.Color('#660000'), // Deep Burgundy/Dark Red
};

export const CONFIG = {
  PARTICLE_COUNT: 50000, // Increased for pile effect
  ORNAMENT_COUNT: 800,   // Increased for pile effect
  TREE_HEIGHT: 18,
  TREE_RADIUS_BASE: 7,
  SCATTER_RADIUS: 45,
};

export const ASPECT_RATIOS = [
  "1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"
];

export const IMAGE_SIZES = ["1K", "2K", "4K"];