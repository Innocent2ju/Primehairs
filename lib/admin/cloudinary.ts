import { v2 as cloudinary } from "cloudinary";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const CLOUDINARY_FOLDER = "primehairs";
const ALLOWED_FORMATS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudinaryUploadError";
  }
}

// The SDK reads CLOUDINARY_URL from the environment (the same configuration
// `app/api/products` relies on); nothing else needs to be configured here.
cloudinary.config({ secure: true });

const uploadBuffer = (
  buffer: Buffer,
): Promise<{ secure_url: string; public_id: string }> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: CLOUDINARY_FOLDER,
        allowed_formats: [...ALLOWED_FORMATS],
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new CloudinaryUploadError(
              error?.message ?? "Cloudinary did not return an upload result.",
            ),
          );
          return;
        }

        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );

    stream.end(buffer);
  });

/**
 * Uploads one image file to the project's Cloudinary account. Only called from
 * admin-guarded server actions.
 */
export async function uploadProductImage(
  file: File,
): Promise<{ url: string; publicId: string }> {
  if (!process.env.CLOUDINARY_URL) {
    throw new CloudinaryUploadError("CLOUDINARY_URL is not configured.");
  }

  if (!file.type.startsWith("image/")) {
    throw new CloudinaryUploadError(`${file.name} is not an image.`);
  }

  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new CloudinaryUploadError(
      `${file.name} must be between 1 byte and 10 MB.`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadBuffer(buffer);

  return { url: result.secure_url, publicId: result.public_id };
}

export const isCloudinaryUrl = (value: string): boolean => {
  try {
    return new URL(value).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
};
