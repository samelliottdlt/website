import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Vector3 } from "three";
import { Perf } from "r3f-perf";
import { PerspectiveCamera } from "@react-three/drei";

const flare0Path = "textures/lensflare/lensflare0.png";
const flare3Path = "textures/lensflare/lensflare3.png";

function DroneWithLight(props: any) {
  const [active, setActive] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const randomOffset = useMemo(() => {
    return {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
    };
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      meshRef.current.position.y +=
        0.01 *
        Math.sin(time * 0.5 + randomOffset.y) *
        Math.cos(time * 0.5 + randomOffset.y);
      meshRef.current.position.x +=
        0.01 *
        Math.cos(time * 0.5 + randomOffset.x) *
        Math.sin(time * 0.5 + randomOffset.x);
    }
  });

  return (
    <group {...props} onClick={() => setActive(!active)}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color={active ? "hotpink" : "#000000"}
          emissive={active ? "hotpink" : "#00FFFF"}
          emissiveIntensity={2}
        />
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
          {/* <FlyControls
          movementSpeed={10}
          rollSpeed={0.1}
          dragToLook
          autoForward={false}
        /> */}

          {/* This is package is currenly bugged with the latest version of three
          <EffectComposer>
            <DepthOfField
              focusDistance={10}
              focalLength={0.01}
              bokehScale={2}
              height={480}
            />
          </EffectComposer> */}
          <Perf />
        </Canvas>
      </div>
    </div>
  );
};

export default DroneArt;
