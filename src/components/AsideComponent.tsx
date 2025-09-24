import { Box, Button, Text } from "@mantine/core";
import { IconArrowDown, IconArrowLeft, IconArrowRight, IconArrowUp, IconMenu2, IconTrash } from "@tabler/icons-react";
import React from "react";
import { type PointCloud, type PointCloudNode } from "../api/types";
import { AppContext } from "../App";

type AsideContextType = {
    curSelectedPoint:number, 
    setCurSelectedPoint:(v:number)=>void
}
const AsideContext = React.createContext<AsideContextType>(null!)
export function AsideComponent(props:{className:string}){
    const [show, setShow] = React.useState(true)
    const [pathPoints, setPathPoints] = React.useState<PointCloudNode[]>(); 
    const [displayPane, setDisplayPane] = React.useState(1)
    const [curSelectedPoint, setCurSelectedPoint] = React.useState(-1)

    const panes:{label:string, target:React.JSX.Element}[] = React.useMemo(() => {
        return [
            {label: "Overview", target: <OverviewPane />},
            {label: "Analyze Path", target: <AnalyzePane />},
        ]
    }, [])

    return <AsideContext.Provider value={{curSelectedPoint, setCurSelectedPoint}}>
        <Box className={`${props.className} ${styles.container}`} bg={'white'}>
            <Box 
                className={styles.toggleButton} 
                children={!show ? <IconArrowLeft /> : <IconArrowRight />} 
                onClick={() => setShow(!show)}
            />

            <Box className={`${styles.content} ${!show && 'hidden'}`}>
                <Box className={styles.header}>
                    {panes.map((p, i) => <Button color={i == displayPane ? "blue" : "gray"} key={i} onClick={() => setDisplayPane(i)} children={p.label} />)}
                </Box>

                <Box className={styles.pane}>
                    {panes[displayPane].target}
                </Box>
            </Box>
        </Box>
    </AsideContext.Provider>
}


function AnalyzePane(props:{}) {
    const [pathPoints, setPathPoints] = React.useState<(PointCloudNode|null)[]>([null, null])
    const {} = React.useContext(AsideContext)
    const {mapDisplaySM} = React.useContext(AppContext)
    const [curSelect, setCurSelect] = React.useState(-1)

    React.useEffect(() => {
        const handleSelectNodeEnter = (v:number) => {
            setCurSelect(v)
        }

        const handleSelectNodeExit = (v:PointCloudNode|null) => {
            if(v)
                setPathPoints(p => {
                    const tmp = [...p]
                    tmp[curSelect] = v
                    return tmp
                })
        }

        mapDisplaySM.addListener("select_node_enter", handleSelectNodeEnter)
        mapDisplaySM.addListener("select_node_exit", handleSelectNodeExit)

        return () => {
            mapDisplaySM.removeListener("select_node_enter", handleSelectNodeEnter)
            mapDisplaySM.removeListener("select_node_exit", handleSelectNodeExit)
        }
    }, [curSelect])

    return <>
        <Text>Path</Text>
        <Box className={styles.pathList}>
            {pathPoints.map((p, i) => <PathItem point={p} selected={curSelect == i && mapDisplaySM.isState("select_node_enter")} onClick={() => mapDisplaySM.setState("select_node_enter", i)} />)}
        </Box>
        <Button children={"Evaluate"} />
    </>
}

function PathItem(props:{selected:boolean, onClick?:()=>void, point:PointCloudNode|null}) {
    return <Box className={styles.pathItem}>
        <IconMenu2 />
        <Button onClick={props.onClick} color={props.selected ? "green" : "blue"} children={props?.point?.Id} />
        <Button children={<IconTrash />} color="red" /> 
    </Box>
}

function OverviewPane(props:{}) {
    return <>
        Overview
    </>
}



const styles = {
    toggleButton: `h-full w-full content-center bg-blue-100`, 
    container: `grid grid-cols-[auto_1fr] grid-rows-1`,
    content: `flex flex-col h-full w-75 p-2`,
    pane: `h-full flex flex-col border`, 
    
    header: `grid grid-rows-1 grid-cols-[1fr_1fr]`, 


    pathList: `grid grid-cols-1 grid-auto-rows border gap-2 p-2`, 
    pathItem: `grid grid-rows-1 grid-cols-[auto_1fr_auto] gap-2 items-center`,
}