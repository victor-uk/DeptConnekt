import LecturerSchema from "../models/LecturerSchema.js"
import StudentSchema from "../models/StudentSchema.js"

export const getSchema = (role) => {
    return (role === "lecturer" || role === "courseAdviser"
        ? LecturerSchema
        : StudentSchema
    )
}