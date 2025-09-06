import type { Model, OSMAddress, ResponseMessage } from "./types"


export class Client {
    host:string
    port:number

    constructor (host:string, port:number){
        this.host = host
        this.port = port
    }

    private async execEndpoint<T>(path:string, query?:Record<string, string>, body?:any):Promise<ResponseMessage<T>>{
        var endpoint = this.host + ":" + this.port + "/" + path
        if(query) {
            endpoint += "?" + new URLSearchParams(query).toString()
        }
        const headers:HeadersInit = {
            "Content-Type": "application/json"
        }
        var requestInit:RequestInit = {
            headers: headers, 
            method: 'GET', 
        }

        if(body) {
            requestInit.body = JSON.stringify(body)
        }

        console.log("Calling endpoint: ", endpoint)
        var resp = await fetch(endpoint, requestInit)

        console.log("Received response object:", resp)
        var respObj:ResponseMessage<T> = await resp.json()

        return respObj
    }

    async getLocation(address:string):Promise<ResponseMessage<OSMAddress>> {
        return await this.execEndpoint<OSMAddress>(
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