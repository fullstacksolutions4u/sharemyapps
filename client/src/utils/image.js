export function optimizeImage(url, width = 'auto') {
  if (!url || typeof url !== 'string') return url;
  
  // If not a Cloudinary URL, return as is (e.g. ui-avatars, local paths, base64)
  if (!url.includes('res.cloudinary.com')) return url;
  
  // If it already has transformations (like /upload/f_auto...), we shouldn't blindly append
  // but for safety, we assume raw URLs from upload like: /upload/v12345/
  
  // Replace /upload/ with /upload/f_auto,q_auto,w_${width},c_limit/
  if (url.includes('/upload/') && !url.includes('/upload/f_auto')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  
  return url;
}
