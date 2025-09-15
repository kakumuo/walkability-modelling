import '@mantine/core/styles.css'
import React from 'react';
import { MantineProvider, Button, Box, Input } from '@mantine/core';
import { MapDisplayComponent } from './components/MapDisplayComponent';
import { AsideComponent } from './components/AsideComponent';
import { VisualizationOverlayComponent } from './components/VisualizationOverlayComponent';
import { HeaderComponent } from './components/HeaderComponent';
import { Canvas } from '@react-three/fiber';
import { Sidebar } from './components/Sidebar';


export function App() {
  const [showSidebar, setShowSidebar] = React.useState(false)

  return <MantineProvider>
    <Box className={styles.container} h={'100vh'} >  
      {/* <VisualizationOverlay className={styles.visualizations} /> */}
      
      <Box className={styles.overlay}>
        <Sidebar className={styles.sidebar} show={showSidebar} /> 
       
        <Box className={styles.overlayMain}>
          <HeaderComponent className={styles.header} onToggleSidebar={() => setShowSidebar(!showSidebar)}  />
          <AsideComponent className={styles.aside} />
          <VisualizationOverlayComponent className={styles.visuals} />
        </Box> 
      </Box>

      <Canvas className={styles.mapDisplay}>
        <MapDisplayComponent/>
      </Canvas>
    </Box>
  </MantineProvider>;
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