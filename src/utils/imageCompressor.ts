/**
 * Utility to compress and edit images client-side for ultra-lightweight storage.
 * Standardizes images to 300x300 JPEG at 0.65 quality (producing 8-15KB files).
 */

export function compressAndResizeImage(
  fileOrBase64: File | string,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.65
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions preserving aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get 2D context from canvas'));
        return;
      }
      
      // Clean background (white)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as compressed JPEG base64 string
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = (err) => {
      reject(err);
    };
    
    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('FileReader returned empty result'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
