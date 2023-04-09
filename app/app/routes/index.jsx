import { io } from "socket.io-client";
import {useState} from 'react';
import Endpoint from "app/Components/Endpoint";
const socket = io("http://localhost:3003",{transports: ["websocket"]});

export default function () {
  const [endpoints, setEndpoints] = useState({active:[]});
  socket.on("connect" , () => {
    console.info(`Connection result: ${socket.connected}`);
  })

  socket.on("endpoints", (data) => {
    setEndpoints(JSON.parse(data));
  });
  return (
    <>
      <div className="flex flex-col">
        <div className="flex justify-center">
          <h1 className="font-bold text-2xl pt-5">Proxy API</h1>
        </div>
        <div className="flex flex-col pt-5 pl-5">
          {endpoints.active && endpoints.active.map((item) => <Endpoint
              url={item.url}
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
