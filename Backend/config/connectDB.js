import mongoose from "mongoose";

const connectDB = async (url) => {
    if (!url) {
        //stops the function
        throw new Error("Enter the database url");
    }
    // setting up the listeners before the .connect fires the event
    mongoose.connection.on("connected", () => console.log("MongoDB connection successful"))
    mongoose.connection.on("error", () => console.log("MongoDB Error"))
    await mongoose.connect(url)

}
export default connectDB