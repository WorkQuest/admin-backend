import * as Joi from 'joi';
import * as handlers from '../../api/v1/chat';
import {
  idSchema,
  idsSchema,
  messageSchema,
  outputOkSchema,
  messageTextSchema, chatNameSchema, chatSchema, emptyOkSchema,
} from '@workquest/database-models/lib/schemes';
import {removeAdminFromGroupChat} from "../../api/v1/chat";

export default [
  {
    method: 'POST',
    path: '/v1/admin/{adminId}/send-message',
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
  {
    method: 'POST',
    path: '/v1/admin/me/chat/group/create',
    handler: handlers.createGroupChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.create',
      description: 'Create new group chat',
      tags: ['api', 'chat'],
      validate: {
        payload: Joi.object({
          name: chatNameSchema.required(),
          adminIds: idsSchema.required().min(1).unique(),
        }).label('CreateGroupChatPayload'),
      },
      response: {
        schema: outputOkSchema(chatSchema).label('CreateGroupChatResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/chat/{chatId}/send-message',
    handler: handlers.sendMessageToChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.sendMessageToChat',
      description: 'Send message to chat',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('SendMessageToChatParams'),
        payload: Joi.object({
          text: messageTextSchema.allow('').default(''),
          medias: idsSchema.required().unique(),
        }).label('SendMessageToChatPayload'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('SendMessageToChatResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/group/{chatId}/add',
    handler: handlers.addAdminsInGroupChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.addAdmins',
      description: 'Add admins in group chat. For one or more admins',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('AddAdminInGroupChatParams'),
        payload: Joi.object({
          adminIds: idsSchema.min(1).unique().required(),
        }).label('AddAdminInGroupChatPayload'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('AddAdminInGroupChatResponse'),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/v1/user/me/chat/group/{chatId}/remove/{adminId}',
    handler: handlers.removeAdminFromGroupChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.removeAdmin',
      description: 'Remove admin from group chat (only for owner)',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
          adminId: idSchema.required(),
        }).label('RemoveAdminInGroupChatParams'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('RemoveAdminInGroupChatResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/group/{chatId}/leave',
    handler: handlers.leaveFromGroupChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.leave',
      description: 'Leave from group chat',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('LeaveFromGroupChatParams'),
      },
      response: {
        schema: outputOkSchema(messageSchema).label('LeaveFromGroupChatResponse'),
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/read/message/{chatId}',
    handler: handlers.setMessagesAsRead,
    options: {
      auth: 'jwt-access',
      id: 'v1.set.message.read',
      description: 'Set message as read',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('ReadMessageParams'),
        payload: Joi.object({
          messageId: idSchema.required(),
        }).label('LeaveFromGroupChatParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/{chatId}/message/{messageId}/star',
    handler: handlers.markMessageStar,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.message.markMessageStar',
      description: 'Mark message star',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          messageId: idSchema,
          chatId: idSchema,
        }).label('MarkMessageStarParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'DELETE',
    path: '/v1/user/me/chat/message/{messageId}/star',
    handler: handlers.removeStarFromMessage,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.message.removeStar',
      description: 'Remove star from message',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          messageId: idSchema.required(),
        }).label('RemoveStarFromMessageParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/user/me/chat/{chatId}/star',
    handler: handlers.markChatStar,
    options: {
      auth: 'jwt-access',
      id: 'v1.mark.chat',
      description: 'Mark chat by star',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('MarkChatParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
  {
    method: 'DELETE',
    path: '/v1/user/me/chat/{chatId}/star',
    handler: handlers.removeStarFromChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.remove.star.chat',
      description: 'Remove star from chat',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('RemoveStarParams'),
      },
      response: {
        schema: emptyOkSchema,
      },
    },
  },
];
