import { API_BASE_URL, authorizedFetch, config } from '@/lib/config';

export function getCategoryImageSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (config.API_URL || '').replace(/\/$/, '');
  return base ? `${base}${url.startsWith('/') ? url : `/${url}`}` : url;
}

async function uploadImage(
  file: File,
  endpoint: 'category-image' | 'subcategory-image' | 'brand-image',
): Promise<string> {
  const fd = new globalThis.FormData();
  fd.append('file', file);

  // Do not set Content-Type — browser/RN set multipart boundary for FormData
  const response = await authorizedFetch(`${API_BASE_URL}/upload/${endpoint}`, {
    method: 'POST',
    body: fd,
  });

  if (!response.ok) throw new Error(`Failed to upload "${file.name}"`);

  const result = await response.json();
  const url: string | undefined = result?.data?.url;
  if (!url) throw new Error('Unexpected image upload response');
  return url;
}

export function uploadCategoryImage(file: File): Promise<string> {
  return uploadImage(file, 'category-image');
}

export function uploadSubCategoryImage(file: File): Promise<string> {
  return uploadImage(file, 'subcategory-image');
}

export const getBrandLogoSrc = getCategoryImageSrc;

export function uploadBrandLogo(file: File): Promise<string> {
  return uploadImage(file, 'brand-image');
}

/** Roll back a file uploaded on save when the follow-up API call fails */
export async function deleteUploadedImage(url: string): Promise<void> {
  if (!url || !url.includes('/uploads/')) return;
  await authorizedFetch(`${API_BASE_URL}/upload/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  }).catch(() => undefined);
}
