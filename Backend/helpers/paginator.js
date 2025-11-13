const paginator = (page, limit) => {
  let queryLimit = limit || 10
  let skip = (page - 1) * limit || 0
  return {queryLimit, skip}
}

export default paginator