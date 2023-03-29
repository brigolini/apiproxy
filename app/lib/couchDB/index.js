const fs = require("fs");

const dbFile = "endpoints.json";

let calls = [];

module.exports = {
    addCall: function (endpoint, message, logger) {
       if (!calls.find(item=>item.endpoint === endpoint)){
           calls = [...calls, {endpoint, ...message}];
           fs.writeFileSync(dbFile, JSON.stringify(calls),()=>{
               logger.error(`Error on save data at ${dbFile}`)
           });
       }
    },
    retrieveCall: function (endpoint, body) {
        if (calls.length === 0){
            const data = JSON.parse(fs.readFileSync(dbFile).toString());
            calls= [...calls, ...data ];
        }
        return calls.find(item=>item.endpoint === endpoint);
    }

}

