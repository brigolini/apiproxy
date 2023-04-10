import {MdDeleteOutline, MdEdit, MdOutlineUpdateDisabled} from "react-icons/md";
import IconButton from "app/Components/Buttons/IconButton";
import {useEffect, useState} from "react";
import {io} from "socket.io-client";

const socket = io("http://localhost:3003",{transports: ["websocket"]});

const Endpoint = ({url, method,status, proxyStatus, handleDelete, handleToggleStatus}) => {
    const [editMode, setEditMode] = useState(false);
    const [fullJSON, setFullJSON] = useState("");
    useEffect(() => {
        socket.on("fullJSON", (data) => {
            setFullJSON(JSON.stringify(JSON.parse(data), null, 2));
        });
    }, []);

    return (
    <div className="flex flex-col">
        <div className="flex p-2 border">
            <div className="w-3/5 overflow-hidden">
                <div>{url}</div>
                <span className="flex gap-x-2">
                    <div className="bg-orange-600 w-12 rounded font-bold text-white flex justify-center"><span>{method}</span></div>
                    {status >=200 && status < 300 && <div className="bg-green-600 w-9 rounded font-bold text-white flex justify-center"><span>{status}</span></div>}
                    {status >=300 && status < 400 && <div className="bg-blue-600 w-9 rounded font-bold text-white flex justify-center"><span>{status}</span></div>}
                    {status >=400 && status < 500 && <div className="bg-red-600 w-9 rounded font-bold text-white flex justify-center"><span>{status}</span></div>}
                    {status >=500 && status < 600 && <div className="bg-purple-600 w-9 rounded font-bold text-white flex justify-center"><span>{status}</span></div>}
                </span>
            </div>
            <div className="w-1/5 flex justify-start">
                <span className="flex gap-x-2 h-6">
                    <IconButton className="bg-rose-600 font-bold text-white rounded">
                    <MdDeleteOutline size={24} onClick={()=>handleDelete(url)} />
                    </IconButton>
                    <IconButton className={`${proxyStatus === "DISABLED"?`bg-fuchsia-600`:`bg-blue-600`} font-bold text-white rounded`}>
                    <MdOutlineUpdateDisabled size={24} onClick={()=>handleToggleStatus(url, proxyStatus)} />
                    </IconButton>
                    <IconButton className="bg-blue-600 font-bold text-white rounded">
                    <MdEdit size={24} onClick={()=> {
                        setEditMode(!editMode);
                        socket.emit("getFullJSON", {url});
                    }}/>
                    </IconButton>
                </span>
            </div>
        </div>
        {editMode && <div className="w-full flex justify-start">
            <div className="w-full h-60 flex flex-col">
                <textarea className="w-full h-full" value={fullJSON}
                   onChange={(e)=> {
                       setFullJSON(e.target.value);
                   }}
                />
                <button className="bg-blue-600 font-bold text-white rounded" onClick={()=> {
                    console.info({url, fullJSON: JSON.parse(fullJSON)});
                    socket.emit("updateFullJSON", {url, fullJSON: JSON.parse(fullJSON)});
                    window.location.href = "/";
                }}>Save</button>
            </div>
        </div>}
    </div>
    )
}

export default Endpoint;
