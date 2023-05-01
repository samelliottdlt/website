import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { CanvasTexture, Vector3, LinearFilter, MeshStandardMaterial, SphereGeometry } from "three";
import { Perf } from "r3f-perf";
import { PerspectiveCamera } from "@react-three/drei";

type GradientBackgroundProps = {
  from: string;
  to: string;
}
function GradientBackground({ from, to }: GradientBackgroundProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const gradient = context!.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    context!.fillStyle = gradient;
    context!.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;
    return texture;
  }, [from, to]);

  return (
    <mesh position={[0, 0, -25]} scale={[100, 100, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
};

function DroneWithLight(props: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      const shakeMagnitude = 0.005;
  
      // Calculate shake offsets
      const xOffset = shakeMagnitude * (Math.random() * 2 - 1);
      const yOffset = shakeMagnitude * (Math.random() * 2 - 1);
      const zOffset = shakeMagnitude * (Math.random() * 2 - 1);
  
      // Apply the shake offsets to the initial position
      meshRef.current.position.set(
        props.position[0] + xOffset,
        props.position[1] + yOffset,
        props.position[2] + zOffset
      );
    }
  });

  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(true);

  const emissiveMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      color: "darkblue",
      emissive: active ? "cyan" : "black",
      emissiveIntensity: active ? 0.5 : 0,
    });
    return material;
  }, [active]);

  useFrame(() => {
    if (hovered && meshRef.current) {
      // Set the emissive color and intensity on hover
      // @ts-ignore
      meshRef.current.material.emissive.set("white");
      // @ts-ignore
      meshRef.current.material.emissiveIntensity = 1;
    } else if (!hovered && meshRef.current) {
      // Reset the emissive color and intensity when not hovered
      // @ts-ignore
      meshRef.current.material.emissive.set(active ? "cyan" : "black");
      // @ts-ignore
      meshRef.current.material.emissiveIntensity = active ? 0.5 : 0;
    }
  });

  const lineRef = useRef<THREE.LineSegments>(null);
  useFrame(() => {
    if (meshRef.current && hovered && lineRef.current) {
        // Set the position of the lineSegments to match the sphere's position
        lineRef.current.position.copy(meshRef.current.position);
    }
  });

  return (
    <group
      {...props}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <primitive object={emissiveMaterial} />
      </mesh>
    </group>
  );
}

const generatePositions = (count: number, xRange: number, yRange: number) => {
  const positions = [];
  const xStep = xRange / (count - 1);
  const yStep = yRange / (count - 1);

  for (let x = 0; x < count; x++) {
    for (let z = 0; z < count; z++) {
      positions.push([x * xStep - xRange / 2, z * yStep - yRange / 2, 1]);
    }
  }

  return positions;
};

const DroneArt: React.FC = () => {
  const droneCount = 5;
  const xRange = 10;
  const yRange = 10;

  const dronePositions = useMemo(
    () => generatePositions(droneCount, xRange, yRange),
    [droneCount, xRange, yRange]
  );

  // Calculate the center of the grid.
  const centerPosition = useMemo(() => {
    const sum = dronePositions.reduce(
      (acc, pos) => {
        acc.x += pos[0];
        acc.y += pos[1];
        acc.z += pos[2];
        return acc;
      },
      { x: 0, y: 0, z: 0 }
    );

    return new Vector3(
      sum.x / dronePositions.length,
      sum.y / dronePositions.length,
      sum.z / dronePositions.length
    );
  }, [dronePositions]);

  // Set the camera's initial position in front of the grid.
  const cameraStartPosition = useMemo(() => {
    return new Vector3(
      centerPosition.x,
      centerPosition.y,
      centerPosition.z + 15
    );
  }, [centerPosition]);

  return (
    <div>
      <h1 className="m-5">Drone Art</h1>
      <div className="w-screen h-screen flex flex-col items-center justify-center">
        <Canvas
          className="w-full h-full"
          onCreated={({ gl }) => {
            gl.setClearColor("black");
          }}
        >
          <PerspectiveCamera
            makeDefault
            position={cameraStartPosition.toArray()}
            fov={50}
          />
          <ambientLight intensity={0.5} />
          {dronePositions.map((position, index) => (
            <DroneWithLight key={index} position={position} />
          ))}
          <GradientBackground from="#000000" to="#061c87" />
          <Perf />
        </Canvas>
      </div>
    </div>
  );
};

export default DroneArt;
