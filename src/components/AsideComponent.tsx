import { Box, Button } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import React from "react";


export function AsideComponent(props:{className:string}){
    const [show, setShow] = React.useState(false)

    return <Box className={`${props.className} ${styles.container}`} bg={'white'}>
        <Box 
            className={styles.toggleButton} 
            
            children={!show ? <IconArrowLeft /> : <IconArrowRight />} 
            onClick={() => setShow(!show)}
        />
        <Box className={`${styles.content} ${!show && 'hidden'}`}>

        </Box>
    </Box>
}


const styles = {
    toggleButton: `h-full w-full content-center bg-blue-100`, 
    container: `grid grid-cols-[auto_1fr] grid-rows-1`,
    content: `h-full w-75`
}