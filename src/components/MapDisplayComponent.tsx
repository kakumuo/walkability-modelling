import { useThree } from "@react-three/fiber";
import * as THREE from 'three'
import { OrbitControls} from '@react-three/drei'
import React from "react";
import type { Model, Structure, PointCloud, Bounds, PointCloudNode } from "src/api/types"
import { AppContext } from "../App";

const SCALING = 10_000
const MODEL_SCALING_2D:THREE.Vector2 = new THREE.Vector2(SCALING, SCALING * .75)
const MODEL_SCALING_3D:THREE.Vector3 = new THREE.Vector3(SCALING, 0, SCALING * .75)


export function MapDisplayComponent(props:{sceneGeometry:Model, pointCloud:PointCloud}){
  const { camera } = useThree()

  // set orbit controls camera
  React.useEffect(() => {    
    var cameraOffset = new THREE.Vector3(-2, 10, 0)

    camera.position.x = cameraOffset.x
    camera.position.y = cameraOffset.y
    camera.position.z = cameraOffset.z

    camera.lookAt(new THREE.Vector3())
    
  }, [camera, props.sceneGeometry])

  const {roadMeshes, buildingMeshes, terrainMesh} = React.useMemo(() => {
    const roadMeshes:React.JSX.Element[] = []
    const buildingMeshes:React.JSX.Element[] = []
    const terrainMesh:React.JSX.Element[] = []

    if(!props.sceneGeometry || !props.pointCloud) return {roadMeshes, buildingMeshes, terrainMesh}

    // geometry from input
    //FIXME: Mesh geometry is skewed to a certain direction
    props.sceneGeometry.Structures.forEach((curStructure, i) => {
      if(curStructure.StructureType == "building")
        buildingMeshes.push(<BuildingMesh key={i} structure={curStructure} />)
      else if (curStructure.StructureType == "road")
        roadMeshes.push(<>
          <RoadMesh key={i} structure={curStructure} />
          {/* <DebugMesh key={"d-" + i} structure={curStructure}/> */}
        </>)
    })

    // FIXME: correct radius sizing
    terrainMesh.push(<TerrainMesh bounds={props.sceneGeometry.Bounds} />)
    terrainMesh.push(<PointCloud pointCloud={props.pointCloud} />)
    
    return {roadMeshes, buildingMeshes, terrainMesh}
  }, [props.sceneGeometry, props.pointCloud])



  return <><OrbitControls  camera={camera} />
    {props.sceneGeometry && <>{roadMeshes} {buildingMeshes} {terrainMesh}</>}
    
    <ambientLight intensity={0.1} />
    <directionalLight position={[0, 100, 0]} color="white"/>
  </>
}

function TerrainMesh (props:{bounds:Bounds}) {
  const {width, height, size} = React.useMemo(() => {
      /*
      radLat := rad / 111_111
      radLon := radLat / math.Cos(lat*0.01745)
      */  
    
     const width = (props.bounds.BoundMax.X - props.bounds.BoundMin.X) * MODEL_SCALING_2D.x
     const height = (props.bounds.BoundMax.Y - props.bounds.BoundMin.Y) * MODEL_SCALING_2D.y
     const size = Math.max(width, height)

      return {width, height, size}
  }, [props.bounds])
  
  return <>
    <mesh position={[0, -.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color={"#a7f3a7"} side={THREE.DoubleSide} />
    </mesh>
    <gridHelper args={[size]}/>
  </>
}

function PointCloud (props: {pointCloud:PointCloud}) {
  const {mapDisplaySM} = React.useContext(AppContext)

  const handlePointCloudClick = (p:PointCloudNode) => {
    if(mapDisplaySM.isState("select_node_enter")) {
      mapDisplaySM.setState("select_node_exit", p)
    }
  }

  return <>{Object.values(props.pointCloud.Points).map((p, i) => 
    <group key={"p-" + i}>
      {/* cloud selector */}
      <mesh onClick={() => handlePointCloudClick(p)} position={new THREE.Vector3(p.Point.X, 0, p.Point.Y).multiply(MODEL_SCALING_3D)}  >
        <sphereGeometry args={[.1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <mesh position={new THREE.Vector3(p.Point.X, 0, p.Point.Y).multiply(MODEL_SCALING_3D)}  >
        <sphereGeometry args={[.025]} />
        <meshBasicMaterial color={'black'} />
      </mesh>
    </group>
  )}
  </>
}


function BuildingMesh(props:{ structure:Structure }) {
  // const height = Math.random() * .75 + .25
  const height = 1

  const {shape} = React.useMemo(() => {
    const points = props.structure.Nodes.map(n => new THREE.Vector2(n.Point.X, -n.Point.Y).multiply(MODEL_SCALING_2D));

    const shape = new THREE.Shape(points);
    return {shape}
  }, [props.structure.Nodes]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} >
      <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false}]} />
      <meshStandardMaterial color={["red", "green", "blue"][Math.ceil(Math.random() * 3)]} />
    </mesh>
  );
}


function RoadMesh(props:{ structure:Structure}) {

  const {path, crossSection} = React.useMemo(() => {
    const points = props.structure.Nodes.map(n => new THREE.Vector3(n.Point.X, 0, n.Point.Y).multiply(MODEL_SCALING_3D))
    const path = new THREE.CurvePath<THREE.Vector3>()
    for(let i = 1; i < points.length; i++){
      path.add(new THREE.LineCurve3(points[i - 1], points[i]))
    }

    let roadRadius = 0

    switch(props.structure.StructureDetails["highway"]) {
      case "secondary": 
        roadRadius = 4.5; 
        break; 
      case "residential":
        roadRadius = 3; 
        break;
      case "service":
        roadRadius = 1; 
        break;
      default: 
        roadRadius = 2; 
    }

    const crossSection = new THREE.Shape([
      new THREE.Vector2(0,(-.1/SCALING) * roadRadius * MODEL_SCALING_2D.x), 
      new THREE.Vector2(0, (.1/SCALING) * roadRadius * MODEL_SCALING_2D.y)
    ])

    return {path, crossSection, roadRadius}
  }, [props.structure.Nodes]);

  return (
    <mesh>
      <extrudeGeometry args={[crossSection, {extrudePath: path, steps: 100, curveSegments: 100}]} />
      <meshStandardMaterial color="white" />
    </mesh> 
  );
}


function DebugMesh(props:{structure:Structure}) {
  const colorArr = ["white", "blue", "orange", "green"]
  const [color, _] = React.useState(colorArr[Math.ceil(Math.random() * colorArr.length)])

  const points = React.useMemo(() => {
    return props.structure.Nodes.map(n => new THREE.Vector3(n.Point.X, 0, n.Point.Y).multiply(MODEL_SCALING_3D))
  }, [props.structure.Nodes]);

  return <>{points.map((p, i) => 
      <mesh key={"d-" + i} position={p}>
        <sphereGeometry args={[.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
  )}</>
}


