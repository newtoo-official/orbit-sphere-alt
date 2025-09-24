import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface SphereComponentProps {
  color: string;
}

const SphereComponent = ({ color }: SphereComponentProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Subtle idle rotation
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} position={[0, 0, 0]}>
      <meshPhysicalMaterial
        color={color}
        roughness={0.1}
        metalness={0.05}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
      />
    </Sphere>
  );
};

interface OrbitControlsWrapperProps {
  enabled: boolean;
}

const OrbitControlsWrapper = ({ enabled }: OrbitControlsWrapperProps) => {
  return (
    <OrbitControls
      enabled={enabled}
      enableZoom={true}
      enablePan={false}
      enableRotate={enabled}
      autoRotate={false}
      minDistance={2}
      maxDistance={8}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI - Math.PI / 6}
    />
  );
};

export const Scene3D = () => {
  const [isControlsEnabled, setIsControlsEnabled] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        setIsControlsEnabled(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.altKey) {
        setIsControlsEnabled(false);
      }
    };

    const handleBlur = () => {
      setIsControlsEnabled(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-scene-background relative">
      <div className="absolute top-4 left-4 z-10 text-foreground/70 text-sm">
        {isControlsEnabled ? 'Hold Alt + Drag to orbit' : 'Hold Alt to enable orbit controls'}
      </div>
      
      <Canvas
        camera={{ position: [0, 0, 4], fov: 75 }}
        gl={{ 
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        {/* Ambient light for overall illumination */}
        <ambientLight intensity={0.3} color="#f0f0f0" />
        
        {/* Main directional light */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        {/* Fill light from the opposite side */}
        <directionalLight
          position={[-3, -3, 3]}
          intensity={0.4}
          color="#e8e8ff"
        />
        
        {/* Rim light for edge definition */}
        <directionalLight
          position={[0, 0, -5]}
          intensity={0.2}
          color="#ffffff"
        />

        <SphereComponent color="#f8f9fa" />
        <OrbitControlsWrapper enabled={isControlsEnabled} />
      </Canvas>
    </div>
  );
};