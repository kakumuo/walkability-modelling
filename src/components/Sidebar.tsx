import React from 'react'; 
import { Box, Button, Input, Menu, Title, Typography } from "@mantine/core";
import { IconDots, IconEdit, IconLayoutSidebar, IconLoader, IconPlus, IconSearch } from "@tabler/icons-react";
import type { ModelConfig } from 'src/api/types';


const testData: ModelConfig[] = [
    {
        Name: "AlphaModel",
        Id: 1,
        CreatedDate: Date.now() - 1000000,
        UpdatedDate: Date.now() - 500000,
    },
    {
        Name: "BetaModel",
        Id: 2,
        CreatedDate: Date.now() - 2000000,
        UpdatedDate: Date.now() - 1000000,
    },
    {
        Name: "GammaModel",
        Id: 3,
        CreatedDate: Date.now() - 3000000,
        UpdatedDate: Date.now() - 2000000,
    },
    {
        Name: "DeltaModel",
        Id: 4,
        CreatedDate: Date.now() - 4000000,
        UpdatedDate: Date.now() - 3500000,
    },
    {
        Name: "EpsilonModel",
        Id: 5,
        CreatedDate: Date.now() - 5000000,
        UpdatedDate: Date.now() - 4500000,
    },
    ];


export function Sidebar(props:{className:string, show:boolean}){
    return <Box className={`${props.className} ${!props.show && 'hidden'}`}>
        <Box className={styles.header}>
            <Title order={3}>Walkability</Title>
            <Button children={<IconPlus />} />
        </Box>

        <Title order={5}>Models</Title>
        <Box className={styles.sidebarItemList}>
            {testData.map(t => <SidebarItem details={t} />)}
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

function SidebarItem(props:{details:ModelConfig}) {
    return <Box className={styles.sidebarItem}>
        <Typography>{props.details.Name}</Typography>
        <Menu>
            <Menu.Target>
                <Button><IconDots/></Button>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item>Edit</Menu.Item>
                <Menu.Item>Duplicate</Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red">Delete</Menu.Item>
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