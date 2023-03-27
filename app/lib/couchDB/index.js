const NodeCouchDb = require('node-couchdb');


const databaseName = "proxy";
const couch = new NodeCouchDb({
    auth: {
        user: "admin",

    }
});

module.exports = {
    getAvailableDatabases: async function () {
        return await couch.listDatabases()
    },
    init: async function () {
        const dbs = await couch.listDatabases();
        if (dbs.length === 0) {
            await couch.createDatabase(databaseName);
            return "DB was created";
        }
        return "DB already existed"
    },
    addDatabase: async function () {
        return couch.createDatabase(databaseName);
    },
    addCall: async function (endpoint, body) {
        const mangoQuery = {
            selector: {
                _id: {
                    $eq: endpoint
                }
            }
        };
            const result = await couch.mango(databaseName, mangoQuery);
            if (result.data.docs.length === 0){
                // query not found, let me add it
                couch.insert(databaseName, {
                    _id: endpoint,
                    field: body
                })
            }
    },
    retrieveCall: async function (endpoint, body) {
        const mangoQuery = {
            selector: {
                _id: {
                    $eq: endpoint
                }
            }
        };
        const result = await couch.mango(databaseName, mangoQuery);
        if (result.data.docs.length > 0){
            return result.data.docs[0].field;
        }
        return {}
    }

}

