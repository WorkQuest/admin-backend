import * as aws from "aws-sdk";
import { error } from "../../utils";
import config from "../../config/config";
import { Errors } from "../../utils/errors";
import { Media, Admin } from "@workquest/database-models/lib/models";

export class MediaValidator {
  private spaces = new aws.S3({
    accessKeyId: config.cdn.accessKeyId,
    secretAccessKey: config.cdn.secretAccessKey,
    endpoint: config.cdn.endpoint,
  });

  public async MediaMustExists(media: Media) {
    try {
      await this.spaces.getObjectAcl({ Bucket: config.cdn.bucket, Key: media.hash }).promise();
    } catch (err) {
      if (err.code === 'NoSuchKey')       {
        throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
      }
      throw error(Errors.UnknownBucketError, 'Unknown bucket error', {});
    }
  }

  public HasCompleteSetValidate(medias: Media[], mediaIds: string[]) {
    if (medias.length !== mediaIds.length) {
      const userFindingIds = medias.map(media => { return media.id });
      const notFountMediaIds = mediaIds.filter(mediaId => !userFindingIds.includes(mediaId));
      throw error(Errors.NotFound, 'Medias not found', { userIds: notFountMediaIds });
    }
  }
}

