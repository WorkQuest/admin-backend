import * as aws from 'aws-sdk';
import config from "../config/config";
import {
  Media
} from "@workquest/database-models/lib/models";

export function generateMediaHash(length: number): string {
  let result: string[] = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
      charactersLength)));
  }
  return result.join('');
}

const spaces = new aws.S3({
  accessKeyId: config.cdn.accessKeyId,
  secretAccessKey: config.cdn.secretAccessKey,
  endpoint: config.cdn.endpoint,
})

export function getUploadUrlS3(hash: string, contentType: string): string {
  return spaces.getSignedUrl('putObject', {
    Bucket: config.cdn.bucket,
    Key: hash,
    Expires: config.cdn.expiresIn,
    ContentType: contentType,
    ACL: 'public-read'
  });
}

export function deleteObjectS3(hash: string) {
  return spaces.deleteObject({
    Bucket: config.cdn.bucket,
    Key: hash
  })
}

export async function isMediaExists(media: Media) {
  try {
    await spaces.getObjectAcl(
      { Bucket: config.cdn.bucket, Key: media.hash }
    ).promise()
    return true
  } catch (err) {
    if (err.code === 'NoSuchKey')
      return false
    throw err
  }
}
