import type { Model, OSMAddress, OSMLocation, ResponseMessage } from "./types"


export class Client {
    private host:string
    private port:number 

    constructor (host:string, port:number){
        this.host = host
        this.port = port
    }

    private async execEndpoint<T>(path:string, query?:Record<string, string>, body?:any):Promise<ResponseMessage<T>>{
        var endpoint = `http://${this.host}:${this.port}/${path}`
        if(query) {
            endpoint += "?" + new URLSearchParams(query).toString()
        }
        const headers:HeadersInit = {
            "Content-Type": "application/json"
        }
        var requestInit:RequestInit = {
            headers: headers, 
            method: 'GET', 
            mode: 'cors'
        }

        if(body) {
            requestInit.body = JSON.stringify(body)
        }

        console.log("Calling endpoint: ", endpoint)
        var resp = await fetch(endpoint, requestInit)

        console.log("Received response object:", resp)
        const respObj:ResponseMessage<T> = await resp.json(); 

        return respObj
    }

    async getLocation(address:string):Promise<ResponseMessage<OSMLocation[]>> {
        return await this.execEndpoint<OSMLocation[]>(
            "api/location/search", 
            {
                address: address
            }
        )
    }

    async getGeometry(lat:number, lon:number, rad:number):Promise<ResponseMessage<Model>>{
        return await this.execEndpoint<Model>(
            "api/location/geometry", 
            {
                lat: lat.toString(), 
                lon: lon.toString(), 
                rad: rad.toString()
            }
        )
    }

}