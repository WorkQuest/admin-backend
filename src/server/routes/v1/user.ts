import * as Joi from 'joi';
import { addAvatar, getAvatar, getUser, } from '../../api/v1/user';
import config from '../../config/config';
import { outputOkSchema, } from '../../schemes';

export default [
  {
    method: 'GET',
    path: '/v1/user',
    handler: getUser,
    options: {
      id: 'v1.user.get',
      tags: ['api', 'v1', 'user'],
      response: {
        schema: outputOkSchema(
          Joi.object({
            firstName: Joi.string().example('John'),
          })
        ),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/avatar',
    handler: getAvatar,
    options: {
      id: 'v1.user.avatar.get',
      description: `Use this method to receive user's avatar as base64 string.`,
      tags: ['api', 'v1', 'user'],
      response: {
        schema: outputOkSchema(
          Joi.object({
            avatar: Joi.string().example('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAA...'),
            userId: Joi.string().example('b8a94812-2b43-4ee3-80ee-1238c7874678'),
          })
        ),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/avatar',
    handler: addAvatar,
    options: {
      id: 'v1.user.avatar.addf',
      auth: false,
      description: `Use this method to upload user's profile picture (avatar).`,
      notes: `You have to pass image using **Formdata**. Allowed extensions ${config.files.allowedExtensions}`,
      tags: ['api', 'v1', 'user'],
      payload: {
        maxBytes: 1024 * 1024 * 2,
        output: 'data',
        allow: 'multipart/form-data',
        multipart: true,
        parse: true,
      },
      validate: {
        payload: Joi.object({
          avatarImage: Joi.any()
            .meta({ swaggerType: 'file', })
            .optional()
            .allow('')
            .description('image file'),
        }),
        failAction: (req, h, err) => (err.isJoi
          ? h.response(err.details[0]).takeover().code(400)
          : h.response(err).takeover()),
      },
      response: {
        schema: outputOkSchema(
          Joi.object({
            message: Joi.string().example('Your avatar has been added!'),
          })
        ),
      },
    },
  }
];
