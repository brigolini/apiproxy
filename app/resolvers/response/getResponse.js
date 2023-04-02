module.exports = {
    getName: ()=>"get resolver",
    canResolve: (req, realEndpoint)=>req.method === "GET",
    resolve: (req, res, couch)=>{
        const record = couch.retrieveCall(req.url.replace(`/${process.env.PROXY_SEGMENT}`,""))
        return res.status(record.status).json(record.data);
    }

}
