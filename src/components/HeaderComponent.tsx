import React from 'react'; 
import { Box, Button, Input, Menu, Title, Typography } from "@mantine/core";
import { IconLayoutSidebar } from "@tabler/icons-react";


export function HeaderComponent(props:{className:string, targetModelName:string, onToggleSidebar:()=>void}){
    return  <Box data-breakout className={`${props.className} ${styles.container}`}>
        <Box className={styles.banner}>
            <Button onClick={props.onToggleSidebar}><IconLayoutSidebar /></Button>
            <Typography>{props.targetModelName}</Typography>
        </Box>
    </Box>
}

const styles = {
    container: `flex flex-row bg-white`, 
    banner: `grid grid-cols-[auto_1fr] gap-2 m-2`,    
}