import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Point {
  id: string;
  position: THREE.Vector3;
}

interface SphereComponentProps {
  color: string;
  onSphereClick: (point: THREE.Vector3) => void;
  altPressed: boolean;
}

const SphereComponent = ({ color, onSphereClick, altPressed }: SphereComponentProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { raycaster, camera, mouse } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      // Subtle idle rotation
      meshRef.current.rotation.y += 0.002;
    }
  });

  const handleClick = (event: any) => {
    if (altPressed || !meshRef.current) return;
    
    event.stopPropagation();
    
    // Update mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with the sphere
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;
      onSphereClick(intersectionPoint);
    }
  };

  return (
    <Sphere 
      ref={meshRef} 
      args={[1, 64, 64]} 
      position={[0, 0, 0]}
      onClick={handleClick}
    >
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

interface YellowPointProps {
  position: THREE.Vector3;
}

const YellowPoint = ({ position }: YellowPointProps) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshBasicMaterial color="#ffd700" />
    </mesh>
  );
};

interface CatmullRomCurveProps {
  points: Point[];
  sphereRadius?: number;
}

const CatmullRomCurve = ({ points, sphereRadius = 1 }: CatmullRomCurveProps) => {
  const [curveGeometry, setCurveGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (points.length < 2) {
      setCurveGeometry(null);
      return;
    }

    // Create Catmull-Rom curve
    const curvePoints = points.map(p => p.position);
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    
    // Get interpolated points (more points = smoother curve)
    const numPoints = Math.max(50, points.length * 20);
    const interpolatedPoints = curve.getPoints(numPoints);
    
    // Project each interpolated point onto the sphere surface
    const projectedPoints = interpolatedPoints.map(point => {
      const normalized = point.clone().normalize();
      return normalized.multiplyScalar(sphereRadius);
    });

    // Create geometry from projected points
    const geometry = new THREE.BufferGeometry().setFromPoints(projectedPoints);
    setCurveGeometry(geometry);

    // Cleanup previous geometry
    return () => {
      geometry.dispose();
    };
  }, [points, sphereRadius]);

  if (!curveGeometry) return null;

  return (
    <primitive object={new THREE.Line(curveGeometry, new THREE.LineBasicMaterial({ 
      color: "#ffd700",
      linewidth: 3 
    }))} />
  );
};

export const Scene3D = () => {
  const [isControlsEnabled, setIsControlsEnabled] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

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

  const handleSphereClick = (position: THREE.Vector3) => {
    const newPoint: Point = {
      id: `point-${Date.now()}-${Math.random()}`,
      position: position.clone()
    };
    setPoints(prev => [...prev, newPoint]);
  };

  return (
    <div className="w-full h-screen bg-scene-background relative">
      <div className="absolute top-4 left-4 z-10 text-foreground/70 text-sm space-y-1">
        <div>{isControlsEnabled ? 'Hold Alt + Drag to orbit' : 'Hold Alt to enable orbit controls'}</div>
        <div>Click on sphere to add yellow points</div>
        {points.length > 0 && <div className="text-xs text-foreground/50">Points: {points.length}</div>}
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

        <SphereComponent 
          color="#f8f9fa" 
          onSphereClick={handleSphereClick}
          altPressed={isControlsEnabled}
        />
        
        {/* Render yellow points */}
        {points.map(point => (
          <YellowPoint key={point.id} position={point.position} />
        ))}
        
        {/* Render Catmull-Rom curve */}
        <CatmullRomCurve points={points} sphereRadius={1} />
        
        <OrbitControlsWrapper enabled={isControlsEnabled} />
      </Canvas>
    </div>
  );
};