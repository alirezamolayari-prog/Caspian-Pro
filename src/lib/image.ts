/**
 * Shrinks a photo before upload: longest side ≤ 1600 px, JPEG ~0.75.
 * A 5 MB phone photo becomes ~300 KB, so it uploads on weak connections and
 * fits in the offline queue.
 */
export const MAX_SIDE = 1600;

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export async function compressImage(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const url = canvas.toDataURL('image/jpeg', 0.75);
    if (!url.startsWith('data:image/jpeg')) throw new Error('encode failed');
    return url;
  } catch {
    // Old browsers: send the original if it is small enough for the server (2 MB).
    if (file.size <= 1.5 * 1024 * 1024 && /^image\/(jpeg|png|webp)$/.test(file.type)) {
      return readAsDataUrl(file);
    }
    throw new Error('photo');
  }
}
