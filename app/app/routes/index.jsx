import { io } from "socket.io-client";
import {useEffect, useState} from 'react';
import Endpoint from "app/Components/Endpoint";
const socket = io("http://localhost:3003",{transports: ["websocket"]});

export default function () {
  const [endpoints, setEndpoints] = useState([]);
  const [endpointsFiltered, setEndpointsFiltered] = useState([]);
  const [query, setQuery] = useState("");
  socket.on("connect" , () => {
    console.info(`Connection result: ${socket.connected}`);
  })

  useEffect(() => {
    const filtered = query !== "" ? endpoints.filter(item=>item.url.toUpperCase().includes(query.toUpperCase()) || (item.status.toString()).includes(query.toUpperCase())) : endpoints;
    setEndpointsFiltered(filtered);
  }, [query]);

  socket.on("endpoints", (data) => {
    const jsonData = JSON.parse(data);
    const sortedByTimestamp = Array.isArray(jsonData.active)? jsonData.active.sort((a, b) => {
        return a.timestamp - b.timestamp;
    }) : [];
    setEndpoints(sortedByTimestamp);
    setEndpointsFiltered(sortedByTimestamp);
  });

  return (
    <>
      <div className="flex flex-col">
        <div className="flex justify-center">
          <h1 className="font-bold text-2xl pt-5">Proxy API</h1>
        </div>
        <div className="flex justify-center">
          <input className="bg-blue-60 w-3/5 border-violet-950 border rounded-lg p-2" onChange={(e)=>setQuery(e.target.value)}/>
        </div>
        <div className="flex flex-col pt-5 pl-5">

            {endpointsFiltered && endpointsFiltered.map((item) => <Endpoint
                url={item.url}
                timestamp={item.timestamp}
                method={item.method}
                status={item.status}
                proxyStatus={item.proxyStatus}
                handleDelete={(endpoint)=> {
                  socket.emit("delete", {endpoint});
                }}
                handleToggleStatus={(endpoint, status) => {
                  socket.emit("toggleStatus", {endpoint, status});
                }}
            />)}
        </div>

      </div>
    </>
  );
}
