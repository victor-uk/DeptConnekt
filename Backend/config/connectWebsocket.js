import { Server } from "socket.io";
import { whitelist } from "./defaults.js";
import { InternalServerError } from "../utils/Error.js";
import jwt from "jsonwebtoken"
import { getUser } from "../helpers/getUser.js";
let io;

export const initServer = async (server) => {
    io = new Server(server, {
        cors: {
            origin: whitelist
        }
    })

    io.use((socket, next) => {
        let token = socket.handshake.headers.authorization
        if (!token) {
            return next(new InternalServerError("Missing token"))
        }
        try {
            let decodedToken = jwt.verify(token, process.env.JWT_SECRET)
            socket.user = decodedToken
            console.log("socket connection secure");
            next()
        } catch (error) {
            return next(new InternalServerError("Invalid token"))
        }
    })

    io.on("connection", async (socket) => {
        const { id, role } = socket.user
        const user = await getUser(role, id)
        const admissionYear = user?.admissionYear
        console.log(`Socket connection with ${socket.id} successfully established`);

        socket.on("join", () => {
            socket.join(`user:${id}`)
            socket.join(`role:${role}`)
            if (admissionYear) {
                socket.join(`admissionYear:${admissionYear}`)
            }
            socket.emit("joined", {
                message: "Successfully joined rooms",
                rooms: Array.from(socket.rooms)
            })
            console.log('joined successfully');
        })

        // socket object only exists in this socket connection
        socket.on("disconnect", () => {
            console.log(`${socket.id} disconnected from server`);
        })
    })
}

export const getIO = () => {
    if (!io) {
        throw new Error("socket is not initialised")
    }
    return io
}