export const generatePreview = (text) => {
  if (text.length > 150) {
    return text.slice(0, 150) + '...'
  }
  return text
}