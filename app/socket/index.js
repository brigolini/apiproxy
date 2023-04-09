const http = require('http');
const { Server } = require("socket.io");

let io;

const emitActiveEndpoints = (socket) => {
    const couch = require("../lib/couchDB");
    const activeEndpoints = couch.retrieveAll().map(item=> ({
        url: item.endpoint,
        method: item.method,
        status: item.status,
        proxyStatus: item.proxyStatus,
    }));
    socket.emit("endpoints",JSON.stringify({active:activeEndpoints}));
}

const startExpressWithSocket = (app, port) => {
    const logger = require("../Logger");
    const couch = require("../lib/couchDB");
    const server = http.createServer(app);
    io = new Server(server);
    server.listen(port, () => {
        logger.info(`Proxy Api is running on port ${port}`);
    });
    io.on('connection', (socket) => {
        logger.info('Received a connection');
        socket.on("delete", (data) => {
            couch.deleteCall(data.endpoint, logger);
            emitActiveEndpoints(socket);
        });
        socket.on("edit", (data) => {
            couch.changeCall(data.endpoint, logger);
            emitActiveEndpoints(socket);
        });
        socket.on("getFullJSON",(data) => {
            const call = couch.retrieveCall(data.url);
            socket.emit("fullJSON", JSON.stringify(call));
        });
        socket.on("toggleStatus", (data) => {
            if (data.status === "ENABLED" || data.status === undefined) {
                couch.disableCall(data.endpoint, logger);
            } else {
                couch.enableCall(data.endpoint, logger);
            }
            emitActiveEndpoints(socket);
        });
        socket.on("enable", (data) => {
            couch.enableCall(data.endpoint, logger);
            emitActiveEndpoints(socket);
        });
        emitActiveEndpoints(socket)
    });

    return io;
}

const sendSocketMessage = (message) => {
    io.sockets.emit("message",JSON.stringify(message));
}


module.exports = {
    startExpressWithSocket,
    sendSocketMessage,
}
