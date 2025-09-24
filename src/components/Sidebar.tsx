import React from 'react'; 
import { Box, Button, Input, Menu, Title, Typography } from "@mantine/core";
import { IconDots, IconEdit, IconLayoutSidebar, IconLoader, IconPlus, IconSearch } from "@tabler/icons-react";
import type { ModelConfig } from 'src/api/types';
import { NewModelModalComponent } from './NewModelModalComponent';

export function Sidebar(props:{className:string, show:boolean, recentModels:ModelConfig[], onLoadModel:(modelId:number)=>void}){
    return <Box className={`${props.className} ${!props.show && 'hidden'}`}>
        <Box className={styles.header}>
            <Title order={5}>Walkability Modelling</Title>
            <NewModelModalComponent />
        </Box>

        <Title order={4}>Models</Title>
        <Box className={styles.sidebarItemList}>
            {props.recentModels.map((t, i) => <SidebarItem key={i} details={t} onLoadModel={props.onLoadModel} />)}
        </Box>


        <Box className={styles.profile} >
            <Typography>John Doe</Typography>
            <Menu>
                <Menu.Target>
                    <Button><IconDots/></Button>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Item>Settings</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red">Log Out</Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Box>
    </Box>
}

function SidebarItem(props:{details:ModelConfig, onLoadModel:(modelId:number)=>void}) {
    return <Box className={styles.sidebarItem}>
        <Typography>{props.details.Name}</Typography>
        <Menu>
            <Menu.Target>
                <Button><IconDots/></Button>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item onClick={() => props.onLoadModel(props.details.Id)}>Load</Menu.Item>
                <Menu.Item>Edit</Menu.Item>
                {/* <Menu.Divider />
                <Menu.Item color="red">Delete</Menu.Item> */}
            </Menu.Dropdown>
        </Menu>
    </Box>
}


const styles = {
    header: `grid grid-cols-[1fr_auto] grid-rows-1 mb-8`, 
    sidebarItemList: `grid grid-flow-row auto-rows-max gap-2`, 
    sidebarItem: `grid grid-cols-[1fr_auto] grid-rows-1 justify-between items-center`,

    profile: `mt-auto grid grid-cols-[1fr_auto] grid-rows-1 items-center`
}