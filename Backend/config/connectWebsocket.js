import { Server } from "socket.io";
import { whitelist } from "./defaults.js";

let io;

export const initServer = (server) => {
    io = new Server(server, {
        cors: {
            origin: whitelist
        }
    })

    io.on("connection", (socket) => {
        console.log(`Socket connection with ${socket.id} successfully established`);

        // socket object only exists in this socket connection
        socket.on("disconnect", () => {
            console.log(`${socket.id} disconnected from server`);
        })
    })
}

export const getIO = () =>{
    if (!io) {
        throw new Error("socket is not initialised")
    }
    return io
}