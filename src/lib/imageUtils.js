const MAX_PROFILE_IMAGE_PAYLOAD_BYTES = 62_000;

export function estimateDataUrlBytes(dataUrl) {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

export function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not process image.'));
    image.src = dataUrl;
  });
}

export function encodeImage(image, scale, quality) {
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available in this browser.');
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function toDataUrl(file) {
  if (!String(file?.type || '').startsWith('image/')) {
    throw new Error('Please choose a valid image file.');
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  if (estimateDataUrlBytes(sourceDataUrl) <= MAX_PROFILE_IMAGE_PAYLOAD_BYTES) {
    return sourceDataUrl;
  }

  const image = await loadImageFromDataUrl(sourceDataUrl);
  const maxEdge = Math.max(image.width || 1, image.height || 1);
  const naturalScale = maxEdge > 1600 ? 1600 / maxEdge : 1;
  let optimized = sourceDataUrl;

  for (let index = 0; index < 12; index += 1) {
    const scaleFactor = Math.max(0.12, 1 - index * 0.08);
    const quality = Math.max(0.32, 0.86 - index * 0.05);
    const scale = Math.min(naturalScale, naturalScale * scaleFactor);
    optimized = encodeImage(image, scale, quality);
    if (estimateDataUrlBytes(optimized) <= MAX_PROFILE_IMAGE_PAYLOAD_BYTES) {
      return optimized;
    }
  }

  if (estimateDataUrlBytes(optimized) > MAX_PROFILE_IMAGE_PAYLOAD_BYTES) {
    throw new Error('Image is too large. Please choose a smaller image.');
  }

  return optimized;
}
