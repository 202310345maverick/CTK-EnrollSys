import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: "image" | "raw" | "auto" | "video";
    ocr?: string;
  }
): Promise<{ public_id: string; secure_url: string; url: string; info?: any }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "ctk-enrollsys",
        public_id: options.public_id,
        resource_type: options.resource_type ?? "auto",
        ...(options.ocr ? { ocr: options.ocr } : {}),
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          info: (result as any).info,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string, resourceType: string = "auto"): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType as any });
}

export default cloudinary;
