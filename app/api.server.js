const express = require("express");
var proxy = require('express-http-proxy');
const winston = require('winston');
const { format } = require('winston');
const couch = require("./lib/couchDB");
var cors = require('cors')


const { combine, timestamp, printf } = format;


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

const corsOptions = {
    origin: "http://localhost:8080",
    credentials: true
};
apiProxy.use(cors(corsOptions));
apiProxy.use("/fake-api", proxy('https://stage.stafftrack.net', {
    filter: function (req, res) {
        return mode === "LEARNING";
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        logger.info(`Intercepting ${userReq.url}`);
        const rawData = proxyResData.toString('utf8');
        if (rawData !== ""){
            const data = JSON.parse(rawData);
            couch.addCall(userReq.url, {status:200, data});
            return JSON.stringify(data);
        }
        return JSON.stringify({});
    },
}))

apiProxy.get("/mode/:newMode",
    function (req, res){
        logger.info(`Changing mode to ${req.params.newMode}`)
        if (req.params.newMode !== "LEARNING"
            &&req.params.newMode !== "CACHE"
            &&req.params.newMode !== "BOTH"){
            res.status(212).send(JSON.stringify({result: "Mode does not exist"}))
        }
        mode = req.params.newMode;
        res.status(200).send(JSON.stringify({result:"Changed"}))
    })

/*apiProxy.post("/fake-api/!*", function (req, res){
    console.info("trying here");
    console.info(req);
    res.status(200).send('changed')
})*/


apiProxy.all("/fake-api/*", async (req, res) =>{
    logger.info(`Using proxy for ${req.url}`);
    const record = await couch.retrieveCall(req.url.replace("/fake-api",""))
    return res.status(record.status).json(record.data);
})



const port = process.env.API_PORT || 3003;

couch.init().then(()=>{
    apiProxy.listen(port, () => {
        logger.info(`Proxy Api is running on port ${port}`);
    });
})

