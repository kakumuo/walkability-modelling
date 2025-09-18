import React from 'react'
import { Button, Input, Modal, Box, List, Title, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBuildings, IconBuildingStore, IconLocation, IconMapPin, IconPlus, IconSearch } from "@tabler/icons-react";
import { Client } from '../api/Client';
import type { OSMAddress, OSMLocation } from 'src/api/types';

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import { AppContext } from '../App';



export function NewModelModalComponent(props:{}){
    const [opened, { open, close }] = useDisclosure(false);
    const [searchStr, setSearchStr] = React.useState<string>("Newark, NJ")
    const [searchResults, setSearchResults] = React.useState<OSMLocation[]>([])
    const [client, _] = React.useState(new Client("localhost", 4001))

    const [targetLon, setTargetLon] = React.useState(-74.1723667)
    const [targetLat, setTargetLat] = React.useState(40.735657)
    const [targetRad, setTargetRad] = React.useState(100)

    const lonRef = React.useRef<HTMLInputElement>(null!)
    const latRef = React.useRef<HTMLInputElement>(null!)
    const radRef = React.useRef<HTMLInputElement>(null!)
    const titleRef = React.useRef<HTMLInputElement>(null!)

    const {onCreateModel} = React.useContext(AppContext)

    const handleSearch = async (searchString:string) => {
        const results = await client.getLocation(searchString); 
        setSearchResults(results.Data)
        console.log(results.Data)
    }

    const handleItemSelect = (selectedItem:number) => {
        const target = searchResults[selectedItem]
        const lat = typeof(target.lat) == 'string' ? Number.parseFloat(target.lat) : target.lat
        const lon = typeof(target.lon) == 'string' ? Number.parseFloat(target.lon) : target.lon

        setTargetLat(lat)
        setTargetLon(lon)
    }

    const handleCreateModel = () => {
        close()
        onCreateModel(targetLon, targetLat, targetRad, titleRef.current.value)
    }
    
    const center = React.useMemo<[number, number]>(() => {
        const center:[number, number] = [targetLat, targetLon]
        console.log(center)
        return center
    }, [targetLat, targetLon])

    return <>
        <Modal opened={opened} onClose={close} title={"New Model"} size={"xxl"} centered >
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
                            <Circle radius={targetRad} center={center} />
                        </MapContainer>
                    </Box>
                    <Box className={styles.options}>
                        <p>Longitude</p> <Input type="number" value={targetLon} ref={lonRef} onChange={e => setTargetLon(Number.parseFloat(e.currentTarget.value))} />
                        <p>Latitude</p> <Input type="number" value={targetLat} ref={latRef} onChange={e => setTargetLat(Number.parseFloat(e.currentTarget.value))}/>
                        {/* TODO: make radius a slider and set maximum and minimum values */}
                        <p>Radius(m)</p> <Input type="number" value={targetRad} ref={radRef} onChange={e => setTargetRad(Number.parseFloat(e.currentTarget.value == "" ? "0" : e.currentTarget.value))}/>
                        <p>Name</p> <Input defaultValue='Untitled Model' ref={titleRef} />
                        <Button className={styles.createButton} children={"Create"} onClick={handleCreateModel} />
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
        // map.addEventListener("zoomend", mapMoveHandler)

        return () => {
            map.removeEventListener("dragend", mapMoveHandler)
            // map.removeEventListener("zoomend", mapMoveHandler)
        }
    })

    React.useEffect(() => {
        map.setView(props.center)
    }, [props.center])

    return null
}


function ListItem(props:{location:OSMLocation, onClick:()=>void}){

    const {title, icon, subtitle, position, countryCode} = React.useMemo(() => {
        let [title, icon, subtitle, position, countryCode] = Array(5).fill(null!)
        
        title = props.location.name

        switch(props.location.addresstype) {
            case "city": 
            case "county": 
                icon = <IconBuildings />
                break;
            case "shop": 
                icon = <IconBuildingStore />
                break;
            default: 
                icon = <IconMapPin />
        }

        subtitle = `${props.location.address.county}, ${props.location.address.state}`
        position = `${(props.location.lon as number).toFixed(2)}, ${(props.location.lat as number).toFixed(2)}`
        countryCode = props.location.address.country_code.toUpperCase()


        return {title, icon, subtitle, position, countryCode}
    }, [props.location])

    React.useEffect(() => {
        console.log(props.location.address.city)
    })

    return <List.Item onClick={props.onClick} className={styles.listItem.main} >
        <Box className={styles.listItem.header}>
            {icon}
            <Title order={3}>{title}</Title>
            <Text>{countryCode}</Text>
        </Box>
        <Box className={styles.listItem.footer}>
            <Text>{subtitle}</Text>
            <IconLocation />
            <Text>{position}</Text>
        </Box>
    </List.Item>
}


const styles = {
    container: "grid grid-cols-[1fr_2fr] grid-rows-1 h-150 gap-2", 
    colLeft: "grid grid-rows-[auto_1fr] grid-cols-1 gap-2",
    colRight: "grid grid-rows-[3fr_1fr] grid-cols-1 gap-2",

    search: `grid grid-rows-1 grid-cols-[1fr_auto] gap-2`, 
    list: "grid gap-2 border overflow-scroll",
    canvas: "flex border",
    options: "grid grid-auto-rows grid-cols-[auto_1fr] gap-2 border p-2",
    createButton: `col-span-2`, 

    listItem: {
        main:  `border p-2 gap-2`,
        header: `grid grid-cols-[auto_1fr_auto] grid-row-1 items-center gap-2`, 
        footer: `grid grid-cols-[1fr_auto_auto] grid-row-1 items-center gap-2`
    }, 

    map: `w-full h-full`, 
}

