import React from 'react'; 
import { Box, Button, Input, Menu, Title, Typography } from "@mantine/core";
import { IconDots, IconEdit, IconLayoutSidebar, IconLoader, IconPlus, IconSearch } from "@tabler/icons-react";
import type { ModelConfig } from 'src/api/types';


export function HeaderComponent(props:{className:string, onToggleSidebar:()=>void}){
    return  <Box data-breakout className={`${props.className} ${styles.container}`}>
        <Box className={styles.banner}>
            <Button onClick={props.onToggleSidebar}><IconLayoutSidebar /></Button>
            <Typography>DeltaModel</Typography>
        </Box>
    </Box>
}

const styles = {
    container: `flex flex-row bg-white`, 
    banner: `grid grid-cols-[auto_1fr] gap-2 m-2`,    
}