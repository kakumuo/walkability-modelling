import React from 'react'
import { Button, Input, Modal, Box, List } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { Client } from '../api/Client';
import type { OSMAddress, OSMLocation } from 'src/api/types';

import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, TileLayer, Popup, useMap } from 'react-leaflet';
import type { LatLng } from 'leaflet';


export function NewModelModalComponent(props:{}){
    const [opened, { open, close }] = useDisclosure(true);
    const [searchStr, setSearchStr] = React.useState<string>("Newark, NJ")
    const [searchResults, setSearchResults] = React.useState<OSMLocation[]>([])
    const [client, _] = React.useState(new Client("localhost", 4001))

    const [targetLon, setTargetLon] = React.useState(0)
    const [targetLat, setTargetLat] = React.useState(0)
    const [targetRad, setTargetRad] = React.useState(20)

    const lonRef = React.useRef<HTMLInputElement>(null!)
    const latRef = React.useRef<HTMLInputElement>(null!)
    const radRef = React.useRef<HTMLInputElement>(null!)

    const handleSearch = async (searchString:string) => {
        const results = await client.getLocation(searchString); 
        setSearchResults(results.Data)
        console.log(results.Data)
    }

    const handleItemSelect = (selectedItem:number) => {
        if(typeof(searchResults[selectedItem].lat) == 'string')
            setTargetLat(Number.parseFloat(searchResults[selectedItem].lat))
        else
            setTargetLat(searchResults[selectedItem].lat)

        if(typeof(searchResults[selectedItem].lon) == 'string')
            setTargetLon(Number.parseFloat(searchResults[selectedItem].lon))
        else
            setTargetLon(searchResults[selectedItem].lon)
    }
    
    const center = React.useMemo<[number, number]>(() => {return [targetLat, targetLon]}, [targetLat, targetLon])

    return <>
        <Modal opened={opened} onClose={close} title="New Model" size={"xl"} centered >
            <Box className={styles.container}>
                <Box className={styles.colLeft}>
                    <Box className={styles.search}>
                        <Input type="search" value={searchStr} onChange={e => setSearchStr(e.currentTarget.value)}/>
                        <Button children={<IconSearch />} onClick={() => handleSearch(searchStr)} />
                    </Box>
                    <List className={styles.list}>
                        {searchResults.map((loc, i) => <ListItem onClick={() => handleItemSelect(i)} location={loc} key={i}/>)}
                    </List>
                </Box>

                <Box className={styles.colRight}>
                    <Box className={styles.canvas}>
                        {/* TODO: create overlay layer for radius */}
                        <MapContainer className={styles.map} center={center} zoom={targetRad}  >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapRecenter center={center} onMapMove={(center) => {setTargetLat(center.lat); setTargetLon(center.lng)}} />
                        </MapContainer>
                    </Box>
                    <Box className={styles.options}>
                        <p>Longitude</p> <Input type="number" value={targetLon} ref={lonRef} onChange={e => setTargetLon(Number.parseFloat(e.currentTarget.value))} />
                        <p>Latitude</p> <Input type="number" value={targetLat} ref={latRef} onChange={e => setTargetLat(Number.parseFloat(e.currentTarget.value))}/>
                        {/* TODO: make radius a slider and set maximum and minimum values */}
                        <p>Radius(m)</p> <Input type="number" value={targetRad} ref={radRef} onChange={e => setTargetRad(Number.parseFloat(e.currentTarget.value))}/>
                        <Button className={styles.createButton} children={"Create"} />
                    </Box>
                </Box>
            </Box>
        </Modal>

        <Button children={<IconPlus />} onClick={open} />
    </>
}

function MapRecenter(props:{center:[number, number], onMapMove?:(center:LatLng)=>void}){
    const map = useMap(); 

    React.useEffect(() => {
        const mapMoveHandler = () => {
            const center = map.getCenter()
            props.onMapMove && props.onMapMove(center)
        }

        map.addEventListener("dragend", mapMoveHandler)

        return () => {
            map.removeEventListener("dragend", mapMoveHandler)
        }
    })

    React.useEffect(() => {
        map.setView(props.center)
    }, [props.center])

    return null
}


function ListItem(props:{location:OSMLocation, onClick:()=>void}){

    React.useEffect(() => {
        console.log(props.location.address.city)
    })

    return <List.Item onClick={props.onClick} >{
        props.location.address.city}
    </List.Item>
}


const styles = {
    container: "grid grid-cols-[1fr_2fr] grid-rows-1 h-150 gap-2", 
    colLeft: "grid grid-rows-[auto_1fr] grid-cols-1 gap-2",
    colRight: "grid grid-rows-[3fr_1fr] grid-cols-1 gap-2",

    search: `grid grid-rows-1 grid-cols-[1fr_auto] gap-2`, 
    list: "gap-2 border",
    canvas: "flex border",
    options: "grid grid-auto-rows grid-cols-[auto_1fr] gap-2 border p-2",
    createButton: `col-span-2`, 

    listItem: `border `, 

    map: `w-full h-full`, 
}

