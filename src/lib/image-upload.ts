export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
export const IMAGE_UPLOAD_TERMS = 'JPG, PNG, WebP, or GIF only. Maximum size 2MB.';

export const validateImageFile = (file: File) => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG, WebP, or GIF image.';
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be 2MB or smaller.';
  }

  return '';
};

export const readImageFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const validationError = validateImageFile(file);
  if (validationError) {
    reject(new Error(validationError));
    return;
  }

  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read this image. Please try another file.'));
  reader.readAsDataURL(file);
});
