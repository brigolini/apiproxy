const fs = require("fs");

const dbFile = "endpoints.json";

let calls = [];

module.exports = {
    init: function () {
        if (!fs.existsSync(dbFile)) {
            fs.writeFileSync(dbFile, JSON.stringify([]));
        }
    },
    addCall: function (endpoint, message, logger) {
       if (!calls.find(item=>item.endpoint === endpoint)){
           calls = [...calls, {endpoint, ...message}];
           fs.writeFileSync(dbFile, JSON.stringify(calls),()=>{
               logger.error(`Error on save data at ${dbFile}`)
           });
       }
    },
    retrieveCall: function (endpoint) {
        if (calls.length === 0){
            const data = JSON.parse(fs.readFileSync(dbFile).toString());
            calls= [...calls, ...data ];
        }
        return calls.find(item=>item.endpoint === endpoint);
    },
    deleteCall: function (endpoint, logger) {
        calls = calls.filter(item=>item.endpoint !== endpoint);
        fs.writeFileSync(dbFile, JSON.stringify(calls),()=>{
            logger.error(`Error on save data at ${dbFile}`)
        });
    },
    disableCall: function (endpoint, logger) {
        const call = calls.find(item=>item.endpoint === endpoint);
        call.proxyStatus = "DISABLED";
        fs.writeFileSync(dbFile, JSON.stringify(calls),()=>{
            logger.error(`Error on save data at ${dbFile}`)
        });
    },
    enableCall: function (endpoint, logger) {
        const call = calls.find(item=>item.endpoint === endpoint);
        call.proxyStatus = "ENABLED";
        fs.writeFileSync(dbFile, JSON.stringify(calls),()=>{
            logger.error(`Error on save data at ${dbFile}`)
        });
    },
    changeCall: function (endpoint, message, logger) {
        calls = calls.filter(item => item.endpoint !== endpoint);
        calls = [...calls, message];
        fs.writeFileSync(dbFile, JSON.stringify([...calls, message]), () => {
            logger.error(`Error on save data at ${dbFile}`)
        })
    },
    retrieveAll: function () {
        if (calls.length === 0){
            const data = JSON.parse(fs.readFileSync(dbFile).toString());
            calls= [...calls, ...data ];
        }
        return calls;
    }

}

