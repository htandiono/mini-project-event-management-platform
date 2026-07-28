import { describe, expect, it, vi } from "vitest";

import { createSupabaseAssetStorage, type SupabaseStorageApi } from "./asset-storage.service.js";

function createStorageMock(bucketExists: boolean) {
  const fileBucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: "stored" }, error: null }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: {
        publicUrl: "https://project.supabase.co/storage/v1/object/public/eventure-public/file",
      },
    }),
  };
  const getBucket = vi
    .fn()
    .mockResolvedValue(
      bucketExists
        ? { data: { id: "eventure-public" }, error: null }
        : { data: null, error: { message: "not found", status: 404 } },
    );
  const createBucket = vi.fn().mockResolvedValue({
    data: { name: "eventure-public" },
    error: null,
  });
  const api = {
    getBucket,
    createBucket,
    from: vi.fn().mockReturnValue(fileBucket),
  } as unknown as SupabaseStorageApi;

  return { api, fileBucket, getBucket, createBucket };
}

describe("createSupabaseAssetStorage", () => {
  it("uploads images to the existing public bucket", async () => {
    const { api, fileBucket, createBucket } = createStorageMock(true);
    const storage = createSupabaseAssetStorage(api);
    const buffer = Buffer.from("image");

    const result = await storage.upload(buffer, "image/png", "eventure/payment-proofs");

    expect(createBucket).not.toHaveBeenCalled();
    expect(fileBucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^eventure\/payment-proofs\/.+\.png$/),
      buffer,
      { cacheControl: "3600", contentType: "image/png", upsert: false },
    );
    expect(result.url).toContain("/storage/v1/object/public/eventure-public/");
    expect(result.publicId).toMatch(/^eventure\/payment-proofs\/.+\.png$/);
  });

  it("creates the constrained bucket once when it is missing", async () => {
    const { api, getBucket, createBucket } = createStorageMock(false);
    const storage = createSupabaseAssetStorage(api);

    await storage.upload(Buffer.from("first"), "image/jpeg", "eventure/avatars");
    await storage.upload(Buffer.from("second"), "image/webp", "eventure/avatars");

    expect(getBucket).toHaveBeenCalledOnce();
    expect(createBucket).toHaveBeenCalledWith("eventure-public", {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      fileSizeLimit: 5 * 1024 * 1024,
    });
  });

  it("rejects MIME types outside the image allowlist", async () => {
    const { api } = createStorageMock(true);
    const storage = createSupabaseAssetStorage(api);

    await expect(
      storage.upload(Buffer.from("not-an-image"), "application/pdf", "eventure/avatars"),
    ).rejects.toThrow("Unsupported Supabase Storage MIME type: application/pdf");
  });
});
