import { getSchema } from "./getSchema.js"

 export const getUser = (role, id) => {
  const schema = getSchema(role)
  const user = schema.findById(id)
  return user
}