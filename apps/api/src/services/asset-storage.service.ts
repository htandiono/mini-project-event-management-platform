import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { getEnv } from "../config/env.js";
import { deleteFromCloudinary, uploadToCloudinary } from "./cloudinary.service.js";

const SUPABASE_BUCKET = "eventure-public";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface StoredAsset {
  url: string;
  publicId: string;
}

export interface AssetStorage {
  upload(buffer: Buffer, mimeType: string, folder: string): Promise<StoredAsset>;
  remove(publicId: string): Promise<void>;
}

interface StorageErrorLike {
  message: string;
  status?: number;
  statusCode?: string;
}

interface SupabaseFileBucket {
  upload(
    path: string,
    body: Buffer,
    options: { cacheControl: string; contentType: string; upsert: boolean },
  ): Promise<{ data: unknown; error: StorageErrorLike | null }>;
  remove(paths: string[]): Promise<{ data: unknown; error: StorageErrorLike | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
}

export interface SupabaseStorageApi {
  getBucket(id: string): Promise<{ data: unknown; error: StorageErrorLike | null }>;
  createBucket(
    id: string,
    options: { public: boolean; allowedMimeTypes: string[]; fileSizeLimit: number },
  ): Promise<{ data: unknown; error: StorageErrorLike | null }>;
  from(id: string): SupabaseFileBucket;
}

function storageError(action: string, error: StorageErrorLike): Error {
  return new Error(`Supabase Storage ${action} failed: ${error.message}`);
}

function isMissingBucket(error: StorageErrorLike): boolean {
  return error.status === 404 || error.statusCode === "404" || error.statusCode === "NoSuchBucket";
}

export function createSupabaseAssetStorage(storage: SupabaseStorageApi): AssetStorage {
  let bucketReady: Promise<void> | undefined;

  async function initializeBucket(): Promise<void> {
    const existing = await storage.getBucket(SUPABASE_BUCKET);
    if (!existing.error) {
      return;
    }
    if (!isMissingBucket(existing.error)) {
      throw storageError("bucket lookup", existing.error);
    }

    const created = await storage.createBucket(SUPABASE_BUCKET, {
      public: true,
      allowedMimeTypes: Object.keys(IMAGE_EXTENSIONS),
      fileSizeLimit: MAX_FILE_SIZE,
    });
    if (created.error && created.error.status !== 409) {
      throw storageError("bucket creation", created.error);
    }
  }

  function ensureBucket(): Promise<void> {
    bucketReady ??= initializeBucket().catch((error: unknown) => {
      bucketReady = undefined;
      throw error;
    });
    return bucketReady;
  }

  return {
    async upload(buffer, mimeType, folder) {
      await ensureBucket();
      const extension = IMAGE_EXTENSIONS[mimeType];
      if (!extension) {
        throw new Error(`Unsupported Supabase Storage MIME type: ${mimeType}`);
      }

      const normalizedFolder = folder.replace(/^\/+|\/+$/g, "");
      const publicId = `${normalizedFolder}/${randomUUID()}.${extension}`;
      const bucket = storage.from(SUPABASE_BUCKET);
      const uploaded = await bucket.upload(publicId, buffer, {
        cacheControl: "3600",
        contentType: mimeType,
        upsert: false,
      });
      if (uploaded.error) {
        throw storageError("upload", uploaded.error);
      }

      return {
        url: bucket.getPublicUrl(publicId).data.publicUrl,
        publicId,
      };
    },

    async remove(publicId) {
      const removed = await storage.from(SUPABASE_BUCKET).remove([publicId]);
      if (removed.error) {
        console.error(`Failed to delete Supabase asset ${publicId}:`, removed.error);
      }
    },
  };
}

const cloudinaryAssetStorage: AssetStorage = {
  upload: (buffer, _mimeType, folder) =>
    uploadToCloudinary(buffer, folder, folder === "eventure/avatars"),
  remove: deleteFromCloudinary,
};

let selectedStorage: AssetStorage | undefined;

function getAssetStorage(): AssetStorage {
  if (selectedStorage) {
    return selectedStorage;
  }

  const env = getEnv();
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    selectedStorage = createSupabaseAssetStorage(client.storage);
  } else {
    selectedStorage = cloudinaryAssetStorage;
  }

  return selectedStorage;
}

export function uploadAsset(
  buffer: Buffer,
  mimeType: string,
  folder = "eventure/avatars",
): Promise<StoredAsset> {
  return getAssetStorage().upload(buffer, mimeType, folder);
}

export function deleteAsset(publicId: string): Promise<void> {
  return getAssetStorage().remove(publicId);
}
