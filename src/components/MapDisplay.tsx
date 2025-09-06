import { Canvas, useThree, type Args } from "@react-three/fiber";
import * as THREE from 'three'
import {Stats, OrbitControls, Line} from '@react-three/drei'
import React, { type JSX } from "react";
import {Client} from '../api/Client'
import type { ResponseMessage, Model, Structure } from "src/api/types"

import data from './../data/geometrytest3.json'

const validBulidingTypes = [
  "church", "semidetached_house"
]

const validRoadTypes = [
  "secondary", "road", "residential"
]

const MODEL_SCALING = 20_000


export function MapDisplay(){
  const [sceneGeometry, setSceneGeometry] = React.useState<ResponseMessage<Model>>()
  const { camera } = useThree()

  React.useEffect(() => {
    // set orbit controls camera
    var cameraOffset = new THREE.Vector3(75, 75, 0)

    camera.position.x = cameraOffset.x
    camera.position.y = cameraOffset.y
    camera.position.z = cameraOffset.z

    // if(sceneGeometry) {
    //   var item0 = sceneGeometry.Data.Structures[0].Nodes[0]
    //   camera.position.x = item0.Point.Latitude
    //   camera.position.z = item0.Point.Longitude
    // }

    camera.lookAt(new THREE.Vector3())   
    
  }, [camera, sceneGeometry])

  React.useEffect(() => {
    // get data
    (async() => {
        const g:ResponseMessage<Model> = data as any
        setSceneGeometry(g)
    })()
  }, [])


  const sceneObjs = React.useMemo(() => {
    const res:JSX.Element[] = []

    if(!sceneGeometry) return res

    // geometry from input
    //FIXME: Mesh geometry is skewed to a certain direction
    sceneGeometry.Data.Structures.forEach((curStructure, i) => {
      var target:JSX.Element = null!

      if(validBulidingTypes.includes(curStructure.StructureType))
        target = <BuildingMesh key={i} structure={curStructure} />

      else if (validRoadTypes.includes(curStructure.StructureType))
        target = <RoadMesh key={i} structure={curStructure} />

      if(target) res.push(target)
    })

    // terrain
    res.push(<TerrainMesh size={sceneGeometry.Data.Bounds.Radius} />)

    return res
  }, [sceneGeometry])

  return <><OrbitControls  camera={camera} />
    {sceneGeometry && 
    <>
        {sceneObjs}
        <gridHelper args={[sceneGeometry.Data.Bounds.Radius]}/>
    </>}
    
    <ambientLight intensity={0.1} />
    <directionalLight position={[0, 0, 5]} color="white"/>
  </>
}

function TerrainMesh (props:{size:number}) {
  return <mesh position={[0, -.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
    <planeGeometry args={[props.size, props.size]} />
    <meshBasicMaterial color={"#a7f3a7"} side={THREE.DoubleSide} />
  </mesh>
}


function BuildingMesh(props:{ structure:Structure }) {
  const {shape, center} = React.useMemo(() => {
    const points = props.structure.Nodes.map(n => new THREE.Vector2(n.Point.X, n.Point.Y).multiplyScalar(MODEL_SCALING));

    const shape = new THREE.Shape(points);
    const center = new THREE.Vector3(
      (props.structure.BoundMax.X + props.structure.BoundMin.X) / 2, 
      0, 
      (props.structure.BoundMax.Y + props.structure.BoundMin.Y) / 2, 
    ); 

    return {shape, center}
  }, [props.structure.Nodes]);

  const height = parseFloat(props.structure.StructureDetails?.height) || 2;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} >
      <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false}]} />
      <meshStandardMaterial color={["red", "green", "blue"][Math.ceil(Math.random() * 3)]} />
    </mesh>
  );
}


function RoadMesh(props:{ structure:Structure }) {
  
  const {path, crossSection} = React.useMemo(() => {
    const points = props.structure.Nodes.map(n => new THREE.Vector3(n.Point.X, 0, n.Point.Y).multiplyScalar(MODEL_SCALING))
    const path = new THREE.CurvePath<THREE.Vector3>()
    for(let i = 1; i < points.length; i++){
      path.add(new THREE.LineCurve3(points[i - 1], points[i]))
    }

    const crossSection = new THREE.Shape([
      new THREE.Vector2(0, -1), 
      new THREE.Vector2(0, 1)
    ])

    return {path, crossSection}
  }, [props.structure.Nodes]);

  const roadWidth = parseFloat(props.structure.StructureDetails?.width) || 2;

  return (
    <mesh>
      <extrudeGeometry args={[crossSection, {extrudePath: path}]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}


