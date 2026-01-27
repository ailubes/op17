import { S3Client } from "@aws-sdk/client-s3";

type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicUrl?: string | null;
  forcePathStyle: boolean;
};

const getEnv = (name: string) => process.env[name]?.trim();

export const getS3Config = (): S3Config => {
  const endpoint = getEnv("S3_ENDPOINT");
  const region = getEnv("S3_REGION");
  const bucket = getEnv("S3_BUCKET");
  const accessKey = getEnv("S3_ACCESS_KEY");
  const secretKey = getEnv("S3_SECRET_KEY");
  const publicUrl = getEnv("S3_PUBLIC_URL");
  const forcePathStyle = (getEnv("S3_FORCE_PATH_STYLE") || "true").toLowerCase() === "true";

  if (!endpoint || !region || !bucket || !accessKey || !secretKey) {
    throw new Error("S3 configuration is missing. Check S3_* environment variables.");
  }

  return { endpoint, region, bucket, accessKey, secretKey, publicUrl, forcePathStyle };
};

export const getS3Client = () => {
  const config = getS3Config();
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  });
};

export const getPublicObjectUrl = (bucket: string, objectKey: string) => {
  const base =
    getEnv("S3_PUBLIC_URL") ||
    (getEnv("S3_ENDPOINT") && bucket
      ? `${getEnv("S3_ENDPOINT")!.replace(/\/+$/, "")}/${bucket}`
      : null);
  if (!base) return null;
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/+$/, "")}/${encodedKey}`;
};
