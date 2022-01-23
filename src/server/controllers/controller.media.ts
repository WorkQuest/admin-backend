import { Media } from "@workquest/database-models/lib/models";
import { error } from "../utils";
import { Errors } from "../utils/errors";
import { isMediaExists } from "../utils/storageService";

export class MediaController {
  static async getMedia(mediaId: string): Promise<Media> {
    const media = await Media.findByPk(mediaId);

    if (!media) {
      throw error(Errors.NotFound, 'Media is not found', { mediaId })
    }
    if (!await isMediaExists(media)) {
      throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
    }

    return media;
  }
  static async getMedias(mediaIds: string[]): Promise<Media[]> {
    const medias = await Media.findAll({
      where: { id: mediaIds }
    });

    // if (medias.length !== mediaIds.length) {
    //   const notFoundIds = mediaIds.filter(id =>
    //     medias.findIndex(media => id === media.id) === -1
    //   );
    //
    //   throw error(Errors.NotFound, 'Medias is not found', { notFoundIds });
    // }
    //
    // for (const media of medias) {
    //   if (!await isMediaExists(media)) {
    //     throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
    //   }
    // }

    return medias;
  }
}
