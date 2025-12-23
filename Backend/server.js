import { createServer } from "http";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import app from "./config/app.js";
import { initServer } from "./config/connectWebsocket.js";

dotenv.config();

// Disable console.log in production to avoid noisy logs
if (process.env.NODE_ENV === "production") {
  console.log = () => {};
}

//create http server
const server = createServer(app);

const port = process.env.PORT || 5000;
const url =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;
// Initialise websockets
try {
    await initServer(server)
    console.log("Websocket connection established")
} catch (error) {
    console.log(error)
}

await connectDB(url);
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});