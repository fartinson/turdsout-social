import { randomUUID } from "node:crypto";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

const DEFAULT_AVATAR_PREFIX = "avatars";
const DEFAULT_UPLOAD_EXPIRY_SECONDS = 300;
export const AVATAR_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_UPLOAD_CONTENT_TYPE = "image/jpeg";

let s3Client: S3Client | null = null;

type AvatarStorageConfig = {
  bucket: string;
  publicBaseUrl: string;
  keyPrefix: string;
  region: string;
};

export type AvatarUploadTarget = {
  uploadUrl: string;
  uploadKey: string;
  headers: Record<string, string>;
  expiresInSec: number;
};

export function avatarUploadsEnabled() {
  return Boolean(
    env.AWS_REGION && env.AVATAR_UPLOAD_BUCKET && env.AVATAR_PUBLIC_BASE_URL,
  );
}

export async function createAvatarUploadTarget(opts: {
  userId: string;
  contentType: string;
  fileSizeBytes: number;
}) {
  const config = getAvatarStorageConfig();
  validateUploadRequest(opts.contentType, opts.fileSizeBytes);

  const uploadKey = buildAvatarUploadKey(opts.userId, config.keyPrefix);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: uploadKey,
    ContentType: opts.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(getS3Client(config.region), command, {
    expiresIn: DEFAULT_UPLOAD_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    uploadKey,
    headers: {
      "Content-Type": opts.contentType,
    },
    expiresInSec: DEFAULT_UPLOAD_EXPIRY_SECONDS,
  } satisfies AvatarUploadTarget;
}

export async function resolveAvatarUploadToPublicUrl(opts: {
  userId: string;
  uploadKey: string;
}) {
  const config = getAvatarStorageConfig();
  const normalizedKey = normalizeAvatarUploadKey(opts.uploadKey);
  if (
    !normalizedKey ||
    !isAvatarUploadOwnedByUser(opts.userId, normalizedKey)
  ) {
    throw new Error("Avatar upload key is invalid.");
  }

  try {
    await getS3Client(config.region).send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: normalizedKey,
      }),
    );
  } catch {
    throw new Error("Avatar upload is missing or expired.");
  }

  return buildAvatarPublicUrl(normalizedKey, config.publicBaseUrl);
}

function getAvatarStorageConfig(): AvatarStorageConfig {
  const bucket = env.AVATAR_UPLOAD_BUCKET?.trim();
  const publicBaseUrl = env.AVATAR_PUBLIC_BASE_URL?.trim();
  const region = env.AWS_REGION?.trim();
  const keyPrefix = sanitizeKeyPrefix(env.AVATAR_UPLOAD_KEY_PREFIX);

  if (!bucket || !publicBaseUrl || !region) {
    throw new Error("Avatar uploads are not configured.");
  }

  return {
    bucket,
    publicBaseUrl,
    keyPrefix,
    region,
  };
}

function getS3Client(region: string) {
  if (!s3Client) {
    s3Client = new S3Client({ region });
  }

  return s3Client;
}

function validateUploadRequest(contentType: string, fileSizeBytes: number) {
  if (contentType !== AVATAR_UPLOAD_CONTENT_TYPE) {
    throw new Error("Only JPEG avatar uploads are supported.");
  }

  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    throw new Error("Avatar file size is invalid.");
  }

  if (fileSizeBytes > AVATAR_UPLOAD_MAX_BYTES) {
    throw new Error("Avatar file is too large.");
  }
}

function buildAvatarUploadKey(userId: string, keyPrefix: string) {
  return `${keyPrefix}/${userId}/${Date.now()}-${randomUUID()}.jpg`;
}

function buildAvatarPublicUrl(uploadKey: string, publicBaseUrl: string) {
  const baseUrl = publicBaseUrl.endsWith("/")
    ? publicBaseUrl
    : `${publicBaseUrl}/`;
  return new URL(uploadKey, baseUrl).toString();
}

function isAvatarUploadOwnedByUser(userId: string, uploadKey: string) {
  const segments = uploadKey.split("/");
  return segments.length >= 3 && segments.at(-2) === userId;
}

function normalizeAvatarUploadKey(uploadKey: string) {
  const trimmed = uploadKey.trim().replace(/^\/+/, "");
  if (!trimmed || trimmed.includes("..")) {
    return null;
  }
  return trimmed;
}

function sanitizeKeyPrefix(rawPrefix: string | undefined) {
  const prefix = rawPrefix?.trim().replace(/^\/+|\/+$/g, "");
  return prefix && prefix.length > 0 ? prefix : DEFAULT_AVATAR_PREFIX;
}
