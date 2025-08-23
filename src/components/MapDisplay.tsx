import { Canvas } from "@react-three/fiber";
import {Stats, OrbitControls} from '@react-three/drei'

export function MapDisplay(props:{className:string}){

  return <Canvas className={props.className}>
    <OrbitControls />
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshPhongMaterial />
    </mesh>

    <gridHelper />

    <ambientLight intensity={0.1} />
    <directionalLight position={[0, 0, 5]} color="red" />
  </Canvas>
}