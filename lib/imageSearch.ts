// Photo → matching product ids. Matching needs a vision model, so it runs on the backend:
// POST multipart `image` to EXPO_PUBLIC_IMAGE_SEARCH_URL, respond with { productIds: string[] }.
const ENDPOINT = process.env.EXPO_PUBLIC_IMAGE_SEARCH_URL;

export const imageSearchAvailable = !!ENDPOINT;

export async function searchByImage(uri: string): Promise<string[]> {
  if (!ENDPOINT) throw new Error('Image search is not configured');
  const body = new FormData();
  body.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  const res = await fetch(ENDPOINT, { method: 'POST', body });
  if (!res.ok) throw new Error(`Image search failed (${res.status})`);
  const json = await res.json();
  return Array.isArray(json.productIds) ? json.productIds : [];
}
