import * as Joi from 'joi';
import * as handlers from '../../api/v1/storageService';
import { outputOkSchema, mediaContentTypeSchema, mediaUploadLinkSchema } from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'POST',
    path: '/v1/storage/get-upload-link',
    handler: handlers.getUploadLink,
    options: {
      auth: 'jwt-access',
      id: 'v1.storage.getUploadLink',
      tags: ['api', 'storage'],
      description: 'Upload file in storage',
      validate: {
        payload: Joi.object({
          contentType: mediaContentTypeSchema.required(),
        }).label('UploadFilePayload'),
      },
      response: {
        schema: outputOkSchema(mediaUploadLinkSchema).label('MediaUploadLinkResponse'),
      },
    },
  },
];
