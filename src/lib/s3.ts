import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Internal endpoint for server-side operations (e.g. inside Docker: http://rustfs:9000)
const S3_ENDPOINT = process.env.S3_ENDPOINT!

// Public endpoint the browser uses for presigned URLs (e.g. http://localhost:9000)
// Falls back to S3_ENDPOINT for non-Docker setups
const S3_PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT || S3_ENDPOINT

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

// Separate client for generating presigned URLs with the public endpoint
const s3PublicClient = new S3Client({
  endpoint: S3_PUBLIC_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET || "invoices"

export async function ensureBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }))
  } catch (err: unknown) {
    const errObj = err as unknown as Record<string, unknown>;
    const isNotFound =
      err instanceof Error &&
      (("$metadata" in errObj &&
        (errObj as { $metadata: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) ||
      (errObj as { name?: string }).name === "NotFound");
    if (!isNotFound) throw err;
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }))
    console.log(`Created S3 bucket: ${BUCKET}`)
  }
}

export async function getUploadPresignedUrl(
  key: string,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(s3PublicClient, command, { expiresIn: 300 })
}

export async function getDownloadPresignedUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return getSignedUrl(s3PublicClient, command, { expiresIn: 3600 })
}
