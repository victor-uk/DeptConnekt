/**
 * Builds a MongoDB filter object from request query parameters.
 *
 * @param {object} query - The request query object (e.g., req.query).
 * @param {string[]} textSearchFields - An array of field names to apply regex text search on.
 * @returns {object} A MongoDB filter object.
 */
export const buildFilter = (query, textSearchFields = []) => {
  const filter = {}
  const { page, limit, ...filterParams } = query

  // Handle text search fields with regex
  textSearchFields.forEach(field => {
    if (filterParams[field]) {
      filter[field] = { $regex: filterParams[field], $options: 'i' }
      delete filterParams[field]
    }
  })

  // Handle boolean 'archived' status
  if (filterParams.archived) {
    filter.archived = filterParams.archived === 'true'
    delete filterParams.archived
  } else {
    filter.archived = false // Default to not showing archived items
  }

  // Assign remaining query parameters as exact matches
  return { ...filter, ...filterParams }
}