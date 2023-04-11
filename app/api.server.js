const express = require("express");
var proxy = require('express-http-proxy');
const couch = require("./lib/couchDB");
var cors = require('cors')
require("dotenv").config()
const fs = require("fs");
const {startExpressWithSocket} = require("./socket");
const logger = require("./Logger");
const sendSocketRefreshMessage = require("./socket").sendSocketRefreshMessage;

let requestResolvers = [];
let responseResolvers = [];
const apiProxy = express();


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
        const willCallServer = couch.retrieveAll().length === 0 || !couch
            .retrieveAll()
            .some(item => item.endpoint === req.url && item.method === req.method && (item.proxyStatus === undefined ||item.proxyStatus === "ENABLED"));
        logger.info(`The endpoint ${req.url} ${willCallServer? `will be resolved by the server`:`will be resolved by the proxy`} `);
        return willCallServer;
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
    proxyReqOptDecorator: function(proxyReqOpts, originalReq) {
        proxyReqOpts.rejectUnauthorized = false
        return proxyReqOpts;
    }
}))

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
            sendSocketRefreshMessage(req.url.replace(`/${process.env.PROXY_SEGMENT}`,""));
            return resolver.resolve(req, res, couch, logger)
        }
        return res.status(404).send("Not found");
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
logger.info("Initializing Database");
couch.init();
logger.info(`Getting ready to add resolvers from folder ${process.env.RESOLVER_FOLDER}`);
logger.info(`Adding request resolvers`);
requestResolvers = addResolvers("request");
logger.info(`Adding response resolvers`);
responseResolvers = addResolvers("response");
startExpressWithSocket(apiProxy, port)

