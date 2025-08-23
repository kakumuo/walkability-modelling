import '@mantine/core/styles.css'
import {IconLayoutSidebarInactive} from '@tabler/icons-react'
import { MantineProvider, Button, Box, Input } from '@mantine/core';
import { MapDisplay } from './components/MapDisplay';
import { SidebarOverlay } from './components/SidebarOverlay';
import { VisualizationOverlay } from './components/VisualizationOverlay';
import { HeaderComponent } from './components/HeaderComponent';


export function App() {
  return <MantineProvider>
    <Box className={styles.container} h={'100vh'} >  
      {/* <HeaderComponent className={styles.header} />
      <SidebarOverlay className={styles.aside} />
      <VisualizationOverlay className={styles.visualizations} /> */}
      <MapDisplay className={styles.mapDisplay} />
    </Box>
  </MantineProvider>;
}

const styles = {
  container: `border border-10 grid grid-rows-[auto_1fr] grid-cols-2`, 
  header: `z-1 grid grid-cols-[auto_1fr] grid-rows-1 gap-2 row-start-1 col-start-1 `,
  aside: `z-1 ml-auto mb-auto h-4/5 w-3/5 border rounded-sm border-1 row-start-2 col-start-2`, 
  visualizations: `z-1 mt-auto w-full h-1/5 border rounded-sm border-1 row-start-2 col-start-1`, 
  mapDisplay: `z-0 row-start-1 row-span-2 col-start-1 col-span-2`, 
}