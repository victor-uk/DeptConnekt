const pageizer = (page, limit) => {
  let queryLmit = limit || 10
  let skip = (page - 1) * limit || 0
  return {queryLmit, skip}
}

export default pageizer