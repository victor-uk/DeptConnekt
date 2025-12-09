const paginator = (page, limit) => {
  let queryLimit = Number(limit) || 10
  let skip = (Number(page) - 1) * Number(limit) || 0
  return {queryLimit, skip} 
}

export default paginator