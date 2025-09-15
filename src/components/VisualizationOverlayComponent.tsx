import { Box, Button, Tooltip, Typography } from "@mantine/core";
import { IconEar, IconMountain, IconShoe, IconSunglasses, IconTemperature } from "@tabler/icons-react";
import React from "react";


type PaneOption = {
    label: string, 
    icon: React.JSX.Element, 
    target: React.JSX.Element,
}
const paneOptions:PaneOption[] = [
    {label: "Foot Traffic", icon: <IconShoe />, target: <></>},
    {label: "Sunlight & Shade", icon: <IconSunglasses />, target: <></>},
    {label: "Temperature", icon: <IconTemperature />, target: <></>},
    {label: "Sound", icon: <IconEar />, target: <></>},
    {label: "Visual Appeal", icon: <IconMountain />, target: <></>},
]

export function VisualizationOverlayComponent(props:{className:string}){
    const [targetPaneI, setTargetPaneI] = React.useState(-1)

    return <Box className={`${props.className} ${styles.container}`} bg={'white'}>
        <Box className={styles.listSection}>
            {paneOptions.map((option, i) => <ListItem key={i} onClick={() => setTargetPaneI(t => t == i ? -1 : i)} label={option.label} icon={option.icon} />)}
        </Box>

        {targetPaneI != -1 && 
            <Box className={styles.content}>
                <Typography>{paneOptions[targetPaneI].label}</Typography>
            </Box>
        }
    </Box>
}

function ListItem(props:{label:string, icon:React.JSX.Element, onClick:()=>void}) {
    return <Tooltip label={props.label} >
        <Box onClick={props.onClick} children={props.icon} className={styles.listItem}/>
    </Tooltip>
}


const styles = {
    container: `grid grid-cols-[auto_1fr] grid-rows-1`, 
    listSection: `flex flex-col gap-2 p-2`,
    listItem: `grid w-10 aspect-1/1 content-center justify-center bg-gray-100`,
    content: `w-100`
}