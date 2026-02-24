const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD || 'dxftsyhtb').trim();
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_PRESET || 'medcare').trim();

export async function uploadToCloudinary(file) {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', UPLOAD_PRESET);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const res = await fetch(endpoint, {
    method: 'POST',
    body: data,
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || 'Upload failed';
    throw new Error(msg);
  }

  return json.secure_url;
}
