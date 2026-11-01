import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

/** Private, provider-independent adapter. Never returns object keys or bucket credentials to clients. */
@Injectable()
export class StoryboardStorage {
  private client?: S3Client;
  private bucket?: string;
  private configured() {
    if (this.client && this.bucket)
      return { client: this.client, bucket: this.bucket };
    const {
      STORYBOARD_S3_ENDPOINT: endpoint,
      STORYBOARD_S3_BUCKET: bucket,
      STORYBOARD_S3_ACCESS_KEY: accessKeyId,
      STORYBOARD_S3_SECRET_KEY: secretAccessKey,
      STORYBOARD_S3_REGION: region,
    } = process.env;
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey)
      throw new ServiceUnavailableException(
        'Private artwork storage is not configured.',
      );
    const url = new URL(endpoint);
    if (
      url.protocol !== 'https:' &&
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    )
      throw new Error('Object storage requires HTTPS.');
    this.bucket = bucket;
    this.client = new S3Client({
      endpoint,
      region: region || 'auto',
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    return { client: this.client, bucket };
  }
  async health() {
    const { client, bucket } = this.configured();
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  }
  async put(key: string, bytes: Buffer, mime: string) {
    const { client, bucket } = this.configured();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: mime,
        CacheControl: 'private, max-age=3600',
      }),
    );
  }
  async get(key: string) {
    const { client, bucket } = this.configured();
    const object = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    if (!object.Body) throw new Error('Artwork is unavailable.');
    return Buffer.from(await object.Body.transformToByteArray());
  }
}
