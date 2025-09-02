import { Canvas } from "@react-three/fiber";
import {Stats, OrbitControls} from '@react-three/drei'
import React from "react";
import data from './../data/geometrytest.json'

type WorldLocation = {
  lon:number, 
  lat:number
}

const CAMERA_POS_RATIO = 10


export function MapDisplay(props:{className:string}){
  React.useEffect(() => {
    console.log(data); 
  })

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


function BuildingGeometry (props:{geometryData:object, sceneBounds:number[]}) {
  return <mesh>
      
  </mesh>
}