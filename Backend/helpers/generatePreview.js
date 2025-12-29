export const generatePreview = (text) => {
  if (text.length > 300) {
    return text.slice(0, 297) + '...'
  }
  return text
}