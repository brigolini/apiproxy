const path = require("path");
const express = require("express");
var proxy = require('express-http-proxy');
const winston = require('winston');
const { format } = require('winston');



const { combine, timestamp, printf } = format;


const apiProxy = express();

let mode = "LEARNING";

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


apiProxy.use("/fake-api", proxy('https://dev.stafftrack.net', {
    filter: function (req, res) {
        return mode === "LEARNING";
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        logger.info(`Intercepting ${userReq.url}`)
        const data = JSON.parse(proxyResData.toString('utf8'));
        data.fromProxy = true;
        return JSON.stringify(data);

    }
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

apiProxy.post("/fake-api/*", function (req, res){
    console.info("trying here");
    console.info(req);
    res.status(200).send('changed')
})

apiProxy.all("/fake-api/*", function (req, res){
    console.info("trying here");
    console.info(req);
    res.status(404).send('Sorry, we cannot find that!!!!')
})



const port = process.env.API_PORT || 3003;

apiProxy.listen(port, () => {
    logger.info(`Proxy Api is running on port ${port}`);
});

