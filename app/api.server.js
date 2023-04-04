const express = require("express");
var proxy = require('express-http-proxy');
const winston = require('winston');
const { format } = require('winston');
const couch = require("./lib/couchDB");
var cors = require('cors')
require("dotenv").config()
const fs = require("fs");

const { combine, timestamp, printf } = format;
let requestResolvers = [];
let responseResolvers = [];

const apiProxy = express();

let mode = "LEARNING";
//let mode = "CACHE";

const simpleFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ],
    format: combine(
        timestamp(),
        simpleFormat
    )
});

logger.info("Using the follow env files");
logger.info(`Proxy segment: /${process.env.PROXY_SEGMENT}/*`);
logger.info(`Destination: ${process.env.DESTINATION}`);

const corsOptions = {
    origin: "http://localhost:8080",
    credentials: true
};
apiProxy.use(cors(corsOptions));
apiProxy.use(`/${process.env.PROXY_SEGMENT}`, proxy(process.env.DESTINATION, {
    filter: function (req, res) {
        return mode === "LEARNING";
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        logger.info(`Proxy receive URL ${userReq.url}`);
        requestResolvers.forEach(resolver=>{
            if (resolver.canResolve(proxyRes, proxyResData, userReq, userRes)){
                logger.info(`Intercepting ${userReq.url} with resolver: ${resolver.getName()}`);
                resolver.resolve(proxyRes, proxyResData, userReq, userRes,couch);
            }
        })
        return proxyResData

    },
}))

apiProxy.put("/mode/toggle",
    function (req, res){
        const newMode = mode === "CACHE"?"LEARNING":"CACHE";
        logger.info(`Changing mode to ${newMode}`)

        mode = newMode;
        res.status(200).send(JSON.stringify({result:"Changed"}))
    })

apiProxy.get("/mode",function(req, res){
    res.status(200).send(JSON.stringify({mode}))
})

apiProxy.get("/endpoints",function(req, res){
    res.status(200).send(JSON.stringify({endpoints:couch.retrieveAll()}))
})


/*apiProxy.post("/fake-api/!*", function (req, res){
    console.info("trying here");
    console.info(req);
    res.status(200).send('changed')
})*/



apiProxy.all(`/${process.env.PROXY_SEGMENT}/*`, async (req, res) =>{
    responseResolvers.forEach(resolver=>{
        if (resolver.canResolve(req)){
            logger.info(`Proxying ${req.url} with resolver: ${resolver.getName()}`)
            return resolver.resolve(req, res, couch)
        }
    })
})

const addResolvers = (type) => {
    const resolverFiles = fs.readdirSync(`${process.env.RESOLVER_FOLDER}/${type}`);
    console.info(resolverFiles);
    let result = [];
    resolverFiles.forEach(file => {
        const js = require(`${process.env.RESOLVER_FOLDER}/${type}/${file}`);
        if (js.getName){
            result = [js, ...result];
        }
    })
    return result;
}


const port = process.env.API_PORT || 3003;
logger.info(`Getting ready to add resolvers from folder ${process.env.RESOLVER_FOLDER}`);
logger.info(`Adding request resolvers`);
requestResolvers = addResolvers("request");
logger.info(`Adding response resolvers`);
responseResolvers = addResolvers("response");
apiProxy.listen(port, () => {
    logger.info(`Proxy Api is running on port ${port}`);
});

