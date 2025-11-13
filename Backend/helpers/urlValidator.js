export const validateUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return false
  }
  try {
    const allowedHosts = ['res.cloudinary.com', 'cdn.yourapp.com']
    const imageUrl = new URL(value)
    if (allowedHosts.includes(imageUrl.hostname)) {
      return true
    }
    // Allow URLs with image extensions
    if (imageUrl.pathname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return true
    }
    return false
  } catch (error) {
    return false
  }
}