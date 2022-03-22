import * as Joi from 'joi';
import * as handlers from '../../api/v1/chat';
import {
  idSchema,
  idsSchema,
  messageSchema,
  outputOkSchema,
  messageTextSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'POST',
    path: '/v1/user/{adminId}/send-message',
    handler: handlers.sendMessageToAdmin,
    options: {
      auth: 'jwt-access',
      id: 'v1.user.sendMessageToAdmin',
      description: 'Send message to admin',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          adminId: idSchema.required(),
        }).label('SendMessageToAdminParams'),
        payload: Joi.object({
          text: messageTextSchema.allow('').default(''),
          medias: idsSchema.required().unique(),
        }).label('SendMessageToAdminPayload'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('SendMessageToAdmin'),
      },
    },
  },
];
