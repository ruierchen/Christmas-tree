import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';
import { TreeMorphState } from '../types';

// Custom Shader Material for performant morphing
const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMix: { value: 0 }, // 0 = Scatter, 1 = Tree
    uColorHigh: { value: new THREE.Vector3(COLORS.GOLD.r, COLORS.GOLD.g, COLORS.GOLD.b) },
    uColorLow: { value: new THREE.Vector3(COLORS.EMERALD_LIGHT.r, COLORS.EMERALD_LIGHT.g, COLORS.EMERALD_LIGHT.b) },
    uPixelRatio: { value: 1 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMix;
    uniform float uPixelRatio;
    uniform vec3 uColorHigh;
    uniform vec3 uColorLow;
    
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aRandom;
    
    varying float vAlpha;
    varying vec3 vColor;

    // Cubic easing for smoother transitions
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    void main() {
      float t = uTime * (0.2 + aRandom * 0.5);
      
      // Add some noise/wobble to the positions
      vec3 wobble = vec3(
        sin(t + aScatterPos.y * 0.1) * 0.2,
        cos(t + aScatterPos.x * 0.1) * 0.2,
        sin(t + aScatterPos.z * 0.1) * 0.2
      );

      float mixVal = easeInOutCubic(uMix);
      
      // Interpolate position
      vec3 pos = mix(aScatterPos + wobble, aTreePos, mixVal);
      
      // Breathing effect in tree mode
      if (mixVal > 0.8) {
         pos += normal * (sin(t * 2.0) * 0.05);
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Size attenuation
      gl_PointSize = (4.0 + aRandom * 3.0) * uPixelRatio * (15.0 / -mvPosition.z);
      
      // Fade alpha based on mix and distance
      vAlpha = 0.6 + 0.4 * sin(t + aRandom * 10.0);
      
      // Color Mixing based on height in tree mode, or random in scatter
      float heightFactor = (pos.y + 10.0) / 20.0; // approx normalize
      vec3 baseColor = mix(uColorLow, uColorHigh, aRandom * 0.3 + (mixVal * heightFactor * 0.5));
      vColor = baseColor;
    }
  `,
  fragmentShader: `
    varying float vAlpha;
    varying vec3 vColor;

    void main() {
      // Circular soft particle
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      
      float glow = 1.0 - (r * 2.0);
      glow = pow(glow, 2.0); // Sharpen edge
      
      gl_FragColor = vec4(vColor, vAlpha * glow);
    }
  `
};

interface FoliageProps {
  state: TreeMorphState;
}

const Foliage: React.FC<FoliageProps> = ({ state }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Geometry Generation
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = CONFIG.PARTICLE_COUNT;
    
    const scatterPosArray = new Float32Array(count * 3);
    const treePosArray = new Float32Array(count * 3);
    const randomArray = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Scatter: Random Sphere
      const r = CONFIG.SCATTER_RADIUS * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      scatterPosArray[i3] = r * Math.sin(phi) * Math.cos(theta);
      scatterPosArray[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      scatterPosArray[i3 + 2] = r * Math.cos(phi);
      
      // Tree: Cone Spiral
      // y goes from -height/2 to height/2
      const h = CONFIG.TREE_HEIGHT;
      const y = (Math.random() * h) - (h / 2);
      // Normalized height (0 at bottom, 1 at top)
      const yNorm = (y + h/2) / h;
      // Radius shrinks as we go up
      const coneR = CONFIG.TREE_RADIUS_BASE * (1.0 - yNorm);
      // Add thickness to the shell
      const rFinal = coneR * Math.sqrt(Math.random()); 
      const angle = i * 0.1; // Spiral density
      
      treePosArray[i3] = Math.cos(angle) * rFinal;
      treePosArray[i3 + 1] = y;
      treePosArray[i3 + 2] = Math.sin(angle) * rFinal;
      
      randomArray[i] = Math.random();
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(scatterPosArray, 3)); // Initial binding
    geo.setAttribute('aScatterPos', new THREE.BufferAttribute(scatterPosArray, 3));
    geo.setAttribute('aTreePos', new THREE.BufferAttribute(treePosArray, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));
    
    return geo;
  }, []);

  useFrame((stateThree, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta;
      shaderRef.current.uniforms.uPixelRatio.value = stateThree.viewport.dpr;
      
      // Smoothly interpolate uMix based on target state
      const targetMix = state === TreeMorphState.TREE_SHAPE ? 1.0 : 0.0;
      // Determine speed based on direction
      const speed = state === TreeMorphState.TREE_SHAPE ? 1.5 : 2.5; 
      
      shaderRef.current.uniforms.uMix.value = THREE.MathUtils.damp(
        shaderRef.current.uniforms.uMix.value,
        targetMix,
        speed,
        delta
      );
    }
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[FoliageShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;