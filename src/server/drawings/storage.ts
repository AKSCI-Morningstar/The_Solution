import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseKey!) : null;

export async function uploadDrawingFile(
  fileName: string,
  buffer: Buffer,
): Promise<{ fileUrl: string; fileKey: string }> {
  const fileExtension = path.extname(fileName);
  const uniqueId = Math.random().toString(36).substring(2, 15);
  const fileKey = `drawings/${uniqueId}${fileExtension}`;

  if (supabase) {
    // Real Supabase storage upload
    const { data, error } = await supabase.storage.from("drawings").upload(fileKey, buffer, {
      contentType: getContentType(fileExtension),
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      console.error("Supabase upload error, falling back to local storage:", error.message);
    } else if (data) {
      // Get public URL
      const { data: urlData } = supabase.storage.from("drawings").getPublicUrl(fileKey);
      return { fileUrl: urlData.publicUrl, fileKey };
    }
  }

  // Fallback to local storage (saved in public folder so Next.js serves it)
  const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(publicUploadsDir)) {
    fs.mkdirSync(publicUploadsDir, { recursive: true });
  }

  const localPath = path.join(publicUploadsDir, `${uniqueId}${fileExtension}`);
  fs.writeFileSync(localPath, buffer);

  const fileUrl = `/uploads/${uniqueId}${fileExtension}`;
  return { fileUrl, fileKey: localPath };
}

function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".tiff":
    case ".tif":
      return "image/tiff";
    default:
      return "application/octet-stream";
  }
}
