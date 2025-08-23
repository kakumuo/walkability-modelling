import { Box, Button, Input } from "@mantine/core";
import { IconLayoutSidebarInactive } from "@tabler/icons-react";




export function HeaderComponent(props:{className:string}){
    return  <Box data-breakout className={props.className}>
        <Button><IconLayoutSidebarInactive /></Button>
        <Input placeholder='Search...' />
        </Box>
}