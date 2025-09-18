import { type ModelConfig, type Model, type OSMAddress, type OSMLocation, type ResponseMessage, type PointCloud } from "./types.d.ts"


export class Client {
    private host:string
    private port:number 

    constructor (host:string, port:number){
        this.host = host
        this.port = port
    }

    private async execEndpoint<T>(method:string, path:string, query?:Record<string, any>, body?:any):Promise<ResponseMessage<T>>{
        var endpoint = `http://${this.host}:${this.port}/${path}`
        if(query) {
            endpoint += "?" + new URLSearchParams(query).toString()
        }
        const headers:HeadersInit = {
            "Content-Type": "application/json"
        }
        var requestInit:RequestInit = {
            headers: headers, 
            method: method, 
            mode: 'cors'
        }

        if(body) {
            requestInit.body = JSON.stringify(body)
        }

        console.log("Calling endpoint: ", endpoint)
        var resp = await fetch(endpoint, requestInit)
        console.log(endpoint)
        console.log(requestInit)

        console.log("Received response object:", resp)
        const respObj:ResponseMessage<T> = await resp.json(); 

        return respObj
    }



    /**
     * Model
     */
    async upsertModel(modelId:number, modelName?:string) {
        var body = {}
        if(!modelName) {
            body = {
                Id: modelId
            }
        }else {
            body = {
                Id: modelId, 
                Name: modelName
            }
        }

        return await this.execEndpoint<ModelConfig>(
            "post", 
            "api/model", 
            undefined, 
            body
        )
    }

    async initModel(lat:number, lon:number, rad:number, modelId:number) {
        return await this.execEndpoint<null>(
            "POST", 
            "api/model/init", 
            {lat, lon, rad, modelId}
        )
    }

    async getModel(modelId?:number) {
        return await this.execEndpoint<ModelConfig[]>(
            "GET", 
            "api/model", 
            {modelId}
        )
    }

    async getGeometry(modelId:number) {
        return await this.execEndpoint<Model>(
            "GET", 
            "api/model/geometry", 
            {modelId}
        )
    }

    async getPointCloud(modelId:number) {
        return await this.execEndpoint<PointCloud>(
            "GET", 
            "api/model/pointCloud", 
            {modelId}
        )
    }

    /**
     * Location
     */
    async getLocation(address:string):Promise<ResponseMessage<OSMLocation[]>> {
        return await this.execEndpoint<OSMLocation[]>(
            "GET", 
            "api/location/search", 
            {
                address: address
            }
        )
    }
}