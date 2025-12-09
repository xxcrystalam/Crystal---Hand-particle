import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleConfig, ShapeType, HandData } from '../types';
import { generateParticleShape } from '../services/geminiService';

// Add type definitions for React Three Fiber intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      color: any;
      fog: any;
    }
  }
}

// Predefined shape generators
const getShapeCoordinates = (type: ShapeType, count: number): Float32Array => {
  const coords = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const i3 = i * 3;

    if (type === ShapeType.SPHERE) {
      const r = 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta);
      z = r * Math.cos(phi);
    } else if (type === ShapeType.CUBE) {
      const s = 3;
      x = (Math.random() - 0.5) * s;
      y = (Math.random() - 0.5) * s;
      z = (Math.random() - 0.5) * s;
    } else if (type === ShapeType.TORUS) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const R = 2.0; // Major radius
      const r = 0.8; // Minor radius
      x = (R + r * Math.cos(v)) * Math.cos(u);
      y = (R + r * Math.cos(v)) * Math.sin(u);
      z = r * Math.sin(v);
    } else if (type === ShapeType.DNA) {
       const t = (i / count) * Math.PI * 20;
       const radius = 1.2;
       x = Math.cos(t) * radius;
       z = Math.sin(t) * radius;
       y = (i / count) * 8 - 4;
       // Add some thickness/randomness
       x += (Math.random() - 0.5) * 0.2;
       y += (Math.random() - 0.5) * 0.2;
       z += (Math.random() - 0.5) * 0.2;
    } else if (type === ShapeType.STAR) {
      // 3D Spiky Star
      const rBase = 1.0;
      const spikes = 5; 
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      const deform = Math.pow(Math.abs(Math.sin(theta * spikes) * Math.sin(phi * spikes)), 0.5);
      const r = rBase + deform * 2.5;

      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta);
      z = r * Math.cos(phi);
    } else if (type === ShapeType.GALAXY) {
      const arms = 3;
      const armIndex = i % arms;
      const radiusMax = 4.0;
      const r = Math.pow(Math.random(), 0.8) * radiusMax; 
      const angleOffset = (Math.PI * 2 / arms) * armIndex;
      const angle = (r * 2.5) + angleOffset;

      x = Math.cos(angle) * r;
      z = Math.sin(angle) * r;
      const height = (1 - (r / radiusMax)) * 1.5; 
      y = (Math.random() - 0.5) * height;

      x += (Math.random() - 0.5) * 0.3;
      z += (Math.random() - 0.5) * 0.3;
    } else if (type === ShapeType.NEBULA) {
      // Multi-clustered organic clouds
      // Define a few centers for the gas clouds
      const centers = [
         { x: 0, y: 0, z: 0, scale: 2.0 }, // Core
         { x: 2.5, y: 1.0, z: -0.5, scale: 1.2 }, // Lobe 1
         { x: -2.0, y: -1.5, z: 1.0, scale: 1.4 }, // Lobe 2
         { x: 0.5, y: 2.5, z: 0.5, scale: 1.0 }, // Top wisp
      ];
      
      const center = centers[Math.floor(Math.random() * centers.length)];
      
      // Use power for distribution to cluster towards center of each blob
      const r = Math.pow(Math.random(), 0.6) * center.scale; 
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      x = center.x + r * Math.sin(phi) * Math.cos(theta);
      y = center.y + r * Math.sin(phi) * Math.sin(theta);
      z = center.z + r * Math.cos(phi);
      
      // Add slight turbulence/distortion to make it look gaseous
      x += Math.sin(y * 1.5) * 0.4;
      z += Math.cos(x * 1.5) * 0.4;
      y += (Math.random() - 0.5) * 0.5;

    } else if (type === ShapeType.HEART) {
      // Classic Puffy Heart Shape (Hollow Shell)
      // Method: Stack 2D classic heart profiles along the Z axis, scaling them to form a rounded hull.
      
      // Normalized Z from -1 to 1 (representing thickness)
      // Use Math.asin to distribute points more towards edges for uniform density on sphere-like topology, 
      // or simple linear for volume. For hollow shell, we fix Z to random surface points or layered rings.
      
      // Let's create a hollow shell.
      // 1. Pick a Z-layer
      const zNorm = (Math.random() * 2) - 1; // -1 to 1
      const thickness = 1.5;
      z = zNorm * thickness;
      
      // 2. Determine Scale of the 2D heart slice at this Z depth to make it "puffy"
      // Profile is roughly circular/elliptical: scale = sqrt(1 - zNorm^2)
      // Adding a slight taper or power can make it look better
      const scaleZ = Math.pow(1 - Math.pow(Math.abs(zNorm), 2), 0.4); 
      
      // 3. Generate classic 2D heart outline point
      const t = Math.random() * Math.PI * 2;
      
      // Classic Heart Formula
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      const globalScale = 0.15;

      x = hx * scaleZ * globalScale;
      y = hy * scaleZ * globalScale;
      
      // Add slight noise to avoid perfect banding
      x += (Math.random() - 0.5) * 0.05;
      y += (Math.random() - 0.5) * 0.05;
      z += (Math.random() - 0.5) * 0.05;

    } else if (type === ShapeType.FIREWORKS) {
      // Explosion trails from center
      const numTrails = 50;
      const trailIndex = i % numTrails;
      
      // Use a consistent random seed per trail to keep them as lines
      // We simulate this by hashing the trailIndex or using a pre-calc direction
      const trailHash = trailIndex * 123.456;
      const theta = (trailHash % (Math.PI * 2));
      const phi = Math.acos(((trailHash * 0.1) % 2) - 1);
      
      // Direction vector
      const dx = Math.sin(phi) * Math.cos(theta);
      const dy = Math.sin(phi) * Math.sin(theta);
      const dz = Math.cos(phi);
      
      // Distance from center (power ensures more points at core or edge? Let's do even line)
      const distance = Math.pow(Math.random(), 0.5) * 4.0; // Max radius 4.0
      
      // Add randomness/spread to make trails thicker
      const spread = 0.1 * (distance / 4.0); // More spread at ends
      
      x = dx * distance + (Math.random() - 0.5) * spread;
      y = dy * distance + (Math.random() - 0.5) * spread;
      z = dz * distance + (Math.random() - 0.5) * spread;
    }

    coords[i3] = x;
    coords[i3 + 1] = y;
    coords[i3 + 2] = z;
  }
  return coords;
};

interface ParticlesProps {
  config: ParticleConfig;
  handDataRef: React.MutableRefObject<HandData>;
  setLoading: (loading: boolean) => void;
}

const Particles: React.FC<ParticlesProps> = ({ config, handDataRef, setLoading }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const [targetPositions, setTargetPositions] = useState<Float32Array | null>(null);
  
  useEffect(() => {
    const initShape = async () => {
      if (config.shape === ShapeType.AI_GENERATED && config.aiPrompt) {
        setLoading(true);
        try {
          const aiCoords = await generateParticleShape(config.aiPrompt, config.count);
          const flatArr = new Float32Array(config.count * 3);
          aiCoords.forEach((pt, i) => {
            if (i < config.count) {
              flatArr[i * 3] = pt[0];
              flatArr[i * 3 + 1] = pt[1];
              flatArr[i * 3 + 2] = pt[2];
            }
          });
          setTargetPositions(flatArr);
        } catch (e) {
          console.error(e);
          setTargetPositions(getShapeCoordinates(ShapeType.SPHERE, config.count));
        } finally {
          setLoading(false);
        }
      } else {
        setTargetPositions(getShapeCoordinates(config.shape, config.count));
      }
    };
    initShape();
  }, [config.shape, config.count, config.aiPrompt, setLoading]);

  const initialPositions = useMemo(() => {
    const arr = new Float32Array(config.count * 3);
    for(let i=0; i<config.count*3; i++) arr[i] = (Math.random() - 0.5) * 10;
    return arr;
  }, [config.count]);

  useFrame((state) => {
    if (!pointsRef.current || !targetPositions) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const count = config.count;
    
    // Read Hand Data
    const { factor, x: handX, y: handY, isTracking } = handDataRef.current;
    
    // Apply Rotation based on hand position
    const rotationSpeed = 0.05; 
    
    if (isTracking) {
       const targetRotY = handX * 1.5; 
       const targetRotX = handY * 1.5;

       pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRotY, rotationSpeed);
       pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetRotX, rotationSpeed);
    } else {
       pointsRef.current.rotation.y += 0.002; 
       pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, 0, rotationSpeed);
    }

    // Expansion Logic
    const expansion = 0.05 + (factor * 1.5); 
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const tx = targetPositions[i3];
      const ty = targetPositions[i3 + 1];
      const tz = targetPositions[i3 + 2];

      const cx = positions[i3];
      const cy = positions[i3 + 1];
      const cz = positions[i3 + 2];

      const targetX = tx * expansion;
      const targetY = ty * expansion;
      const targetZ = tz * expansion;
      
      const noiseAmp = 0.02 + (factor * 0.05); 
      const noiseFreq = 2.0;
      
      const noiseX = Math.sin(time * noiseFreq + i * 0.1) * noiseAmp;
      const noiseY = Math.cos(time * noiseFreq + i * 0.1) * noiseAmp;
      const noiseZ = Math.sin(time * noiseFreq + i * 0.1) * noiseAmp;

      positions[i3] += (targetX + noiseX - cx) * 0.12;
      positions[i3 + 1] += (targetY + noiseY - cy) * 0.12;
      positions[i3 + 2] += (targetZ + noiseZ - cz) * 0.12;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={initialPositions.length / 3}
          array={initialPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={config.size}
        color={config.color}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
};

interface SceneProps {
  particleConfig: ParticleConfig;
  handDataRef: React.MutableRefObject<HandData>;
  setLoading: (loading: boolean) => void;
}

const Scene: React.FC<SceneProps> = ({ particleConfig, handDataRef, setLoading }) => {
  return (
    <div className="w-full h-full bg-black relative">
      <Canvas camera={{ position: [0, 0, 9], fov: 60 }} dpr={[1, 2]}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 5, 20]} />
        <Particles config={particleConfig} handDataRef={handDataRef} setLoading={setLoading} />
        <OrbitControls enableZoom={true} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
};

export default Scene;