import '@mantine/core/styles.css'
import React from 'react';
import { MantineProvider, Button, Box, Input } from '@mantine/core';
import { MapDisplayComponent } from './components/MapDisplayComponent';
import { AsideComponent } from './components/AsideComponent';
import { VisualizationOverlayComponent } from './components/VisualizationOverlayComponent';
import { HeaderComponent } from './components/HeaderComponent';
import { Canvas } from '@react-three/fiber';
import { Sidebar } from './components/Sidebar';
import { Client } from './api/Client';
import { type ModelConfig, type Model, type PointCloud } from './api/types.ts';
import { StateMachine, type MapDisplayState, type MapDisplayStateParams } from './components/MapDisplayStateMachine.tsx';


type AppData = {
  modelId:number, 
  setModelId:(v:any)=>void

  onCreateModel:(lon:number, lat:number, rad:number, name:string)=>void
  mapDisplaySM:StateMachine<MapDisplayStateParams>
}

export const AppContext = React.createContext<AppData>({} as AppData); 

const [HOST, PORT] = ["127.0.0.1", 4001]

export function App() {
  const [showSidebar, setShowSidebar] = React.useState(false)
  const [modelId, setModelId] = React.useState(-1)  
  const [modelName, setModelName] = React.useState("")
  const [geometry, setGeometry] = React.useState<Model>(null!)
  const [pointCloud, setPointCloud] = React.useState<PointCloud>(null!)

  const [recentModels, setRecentModels] = React.useState<ModelConfig[]>([]); 
  const [recentModelsUpdateTS, setRecentModelsUpdateTS] = React.useState(0)

  const [client, _] = React.useState(new Client(HOST, PORT))
  const [mapDisplaySM, __] = React.useState(new StateMachine<MapDisplayStateParams>())

  // FOR TESTING
  React.useEffect(() => {
    setModelId(1758226233746)
  }, [])

  React.useEffect(() => {
    (async() => {
        const models = await client.getModel()
        if(models.Success)
          setRecentModels(models.Data)
    })()
  }, [recentModelsUpdateTS])

  const onCreateModel = React.useCallback(async (lon:number, lat:number, rad:number, name:string) => {
    console.log("Creating model...")
    const modelConfig = await client.upsertModel(0, name)
    console.log(modelConfig)
    
    console.log("Initializing Model...")
    await client.initModel(lat, lon, rad, modelConfig.Data.Id)

    setRecentModelsUpdateTS(Date.now())
    setModelId(modelConfig.Data.Id)
  }, []); 


  React.useEffect(() => {
    (async() => {
      console.log("Getting model info...")
      const modelDetails = await client.getModel(modelId)

      console.log("Getting Model...")
      const geometry = await client.getGeometry(modelId)

      console.log("Getting Point Cloud...")
      const pointCloud = await client.getPointCloud(modelId)

      if(geometry.Success)
        setGeometry(geometry.Data); 

      if(pointCloud.Success)
        setPointCloud(pointCloud.Data)

      if(modelDetails.Success)
        setModelName(modelDetails.Data[0].Name)
    })()

  }, [modelId])

  return (
  <MantineProvider>
  <AppContext.Provider value={{modelId, setModelId, onCreateModel, mapDisplaySM}}>

      <Box className={styles.container} h={'100vh'} >  
        {/* <VisualizationOverlay className={styles.visualizations} /> */}
        
        <Box className={styles.overlay}>
          <Sidebar className={styles.sidebar} show={showSidebar} recentModels={recentModels} onLoadModel={id => setModelId(id)} /> 
        
          <Box className={styles.overlayMain}>
            <HeaderComponent className={styles.header} targetModelName={modelName} onToggleSidebar={() => setShowSidebar(!showSidebar)}  />
            <AsideComponent className={styles.aside} />
            <VisualizationOverlayComponent className={styles.visuals} />
          </Box> 
        </Box>

        <Canvas className={styles.mapDisplay}>
          <MapDisplayComponent pointCloud={pointCloud} sceneGeometry={geometry}/>
        </Canvas>
      </Box>

  </AppContext.Provider>
  </MantineProvider>
  );
}

const styles = {
    container: `flex flex-row border border-10 relative`, 
  
    overlay: `w-full h-full absolute flex flex-row border`,
      sidebar: `z-6 flex flex-col h-full w-75 p-2 relative border bg-white`,
      overlayMain: `z-6 h-full w-full pointer-events-none bg-transparent relative`,
        header: `absolute border pointer-events-auto`,
        aside: `border h-full right-0 border pointer-events-auto absolute`,
        visuals: `border h-auto w-auto bottom-0 pointer-events-auto absolute`,
    
    mapDisplay: `z-5 row-start-1 row-span-2 `, 
}

// const styles = {
//   container: `border border-10 grid grid-rows-[auto_1fr] grid-cols-2`, 
//   header: `z-1 grid grid-cols-[auto_auto] grid-rows-1 gap-2 row-start-1 col-start-1 `,
//   aside: `z-1 ml-auto mb-auto h-4/5 w-3/5 border rounded-sm border-1 row-start-2 col-start-2`, 
//   visualizations: `z-1 mt-auto w-full h-1/5 border rounded-sm border-1 row-start-2 col-start-1`, 
//   mapDisplay: `z-0 row-start-1 row-span-2 col-start-1 col-span-2`, 
// }