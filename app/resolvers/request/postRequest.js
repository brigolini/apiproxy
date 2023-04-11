
module.exports = {
    getName: ()=>"post request resolver",
    canResolve: (proxyRes, proxyResData, userReq, userRes)=>userReq.method === "POST",
    resolve: (proxyRes, proxyResData, userReq, userRes, couch)=>{
        const rawData = proxyResData.toString('utf8');
        if (rawData !== ""){
            const data = JSON.parse(rawData);
            couch.addCall(userReq.url, {status:200, method:"GET", timestamp: (new Date()).getTime(), data});
            return JSON.stringify(data);
        }
        return JSON.stringify({});

    }

}
