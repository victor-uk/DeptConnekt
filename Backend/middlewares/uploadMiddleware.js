import multer from "multer";
import { attachmentsStorage, storage } from "../config/cloudinary.js";

const parser = multer({ storage: storage})
const attachmentParser = multer({storage: attachmentsStorage})

export { parser, attachmentParser }