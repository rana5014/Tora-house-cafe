import { getSupabaseClient, isConfigured } from './supabaseClient';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Optimizes an image client-side via HTML5 Canvas.
 * Downscales images exceeding maxDimension (e.g. 1200px) and converts to WebP/JPEG
 * at 85% quality to minimize mobile data usage and ensure fast uploading.
 */
export async function optimizeImageClientSide(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // High quality bicubic resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        const outputMime = 'image/webp';
        const dataUrl = canvas.toDataURL(outputMime, quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              // Fallback to jpeg blob
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) resolve({ blob: jpegBlob, dataUrl });
                  else reject(new Error('Failed to generate image blob'));
                },
                'image/jpeg',
                quality
              );
            }
          },
          outputMime,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a product image directly to Supabase Storage (bucket: product-images).
 * If the bucket is not available or storage fails, seamlessly falls back to the
 * client-optimized WebP data URL so the product is updated without interruption.
 */
export async function uploadProductImage(
  file: File,
  productId?: string,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResult> {
  try {
    if (onProgress) onProgress(20);

    // 1. Optimize on client
    const { blob, dataUrl } = await optimizeImageClientSide(file, 1200, 0.85);
    if (onProgress) onProgress(50);

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const ext = safeName.endsWith('.webp') ? '.webp' : '.jpg';
      const fileName = `products/${productId || 'item'}_${timestamp}${ext}`;

      // Try uploading to 'product-images' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/webp',
          upsert: true,
        });

      if (!uploadError && uploadData) {
        if (onProgress) onProgress(90);
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          if (onProgress) onProgress(100);
          return { success: true, url: urlData.publicUrl };
        }
      } else {
        console.warn('[Supabase Storage] Upload error, falling back to optimized inline data URL:', uploadError?.message);
      }
    }

    // Resilient fallback: return optimized dataUrl
    if (onProgress) onProgress(100);
    return { success: true, url: dataUrl };
  } catch (err: any) {
    console.error('[ImageUpload] Error:', err);
    return { success: false, error: err.message || 'Failed to process image' };
  }
}
