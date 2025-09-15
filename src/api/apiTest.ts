import {Client} from './Client'


const cli:Client = new Client("127.0.0.1", 4001); 

(async() => {
    const resp = await cli.getLocation("Newark, NJ")
    console.log(resp); 
})()