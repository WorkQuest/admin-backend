import { error } from './index';
import { Errors } from './errors';
import { isMediaExists } from './storageService';
import {
  Media
} from "@workquest/database-models/lib/models";

export async function getMedia(mediaId: string): Promise<Media> {
  const media = await Media.findByPk(mediaId);
  if (!media) {
    throw error(Errors.NotFound, 'Media is not found', { mediaId })
  }
  if (!await isMediaExists(media)) {
    throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
  }

  return media;
}

export async function getMedias(mediaIds: string[]) {
  const medias = [];
  for (const id of mediaIds) {
    medias.push(await getMedia(id));
  }

  return medias;
}
