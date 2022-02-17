import { generateMediaHash, getUploadUrlS3 } from '../../utils/storageService';
import { output } from "../../utils";
import config from '../../config/config';
import { Media } from '@workquest/database-models/lib/models';
import saveAdminActions from "../../jobs/saveAdminActions";

export async function getUploadLink(r) {
  const hash = generateMediaHash(60);
  const uploadUrl = getUploadUrlS3(hash, r.payload.contentType);

  const media = await Media.create({
    adminId: r.auth.credentials.id,
    contentType: r.payload.contentType,
    url: config.cdn.pubUrl + '/' + hash,
    hash: hash,
  });

  await saveAdminActions({ adminId: r.auth.credentials.id, method: r.method, path: r.path });

  return output({
    mediaId: media.id,
    url: decodeURI(uploadUrl),
  });
}
