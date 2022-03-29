import * as Joi from 'joi';
import * as handlers from '../../api/v1/chat';
import {
  idSchema,
  idsSchema,
  messageSchema,
  outputOkSchema,
  messageTextSchema,
  chatNameSchema,
  chatSchema,
  emptyOkSchema,
  offsetSchema,
  limitSchema,
  messagesWithCountSchema,
  adminSchema,
  outputPaginationSchema,
  chatQuerySchema,
  chatsForGetWithCountSchema,
  sortDirectionSchema,
  messagesForGetWithCountSchema, chatForGetSchema,
} from '@workquest/database-models/lib/schemes';
import {removeAdminFromGroupChat} from "../../api/v1/chat";

export default [
  {
    method: 'POST',
    path: '/v1/admin/{adminId}/send-message',
    handler: handlers.sendMessageToAdmin,
    options: {
      auth: 'jwt-access',
      id: 'v1.admin.sendMessageToAdmin',
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
    path: '/v1/admin/me/chat/group/{chatId}/add',
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
    path: '/v1/admin/me/chat/group/{chatId}/remove/{adminId}',
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
    path: '/v1/admin/me/chat/group/{chatId}/leave',
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
    path: '/v1/admin/me/chat/{chatId}/message/{messageId}/star',
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
    path: '/v1/admin/me/chat/message/{messageId}/star',
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
    path: '/v1/admin/me/chat/{chatId}/star',
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
    path: '/v1/admin/me/chat/{chatId}/star',
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
  {
    method: 'GET',
    path: '/v1/admin/me/chat/messages/star',
    handler: handlers.getAdminStarredMessages,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.messages.getStarredMessages',
      description: 'Get starred messages of the admin',
      tags: ['api', 'chat'],
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetStarredMessagesQuery'),
      },
      response: {
        schema: outputOkSchema(messagesWithCountSchema).label('GetAdminStarredMessagesResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/admin/me/chat/group/{chatId}/members',
    handler: handlers.getChatMembers,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.group.getMembers',
      description: 'Get members in group chat (only for chat members)',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('GetChatMembersParams'),
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('GetChatMembersQuery'),
      },
      response: {
        schema: outputPaginationSchema('admins',adminSchema).label('GetChatMembersResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/admin/me/chats',
    handler: handlers.getAdminChats,
    options: {
      auth: 'jwt-access',
      id: 'v1.me.getChats',
      tags: ['api', 'chat'],
      description: 'Get all chats',
      validate: {
        query: chatQuerySchema,
      },
      response: {
        schema: outputOkSchema(chatsForGetWithCountSchema).label('GetChatsResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/admin/me/chat/{chatId}/messages',
    handler: handlers.getChatMessages,
    options: {
      auth: 'jwt-access',
      id: 'v1.chat.getMessages',
      tags: ['api', 'chat'],
      description: 'Get all messages for chat',
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('GetMessagesParams'),
        query: Joi.object({
          starred: Joi.boolean().default(false),
          offset: offsetSchema,
          limit: limitSchema,
          sort: Joi.object({
            createdAt: sortDirectionSchema.default('DESC'),
          })
            .default({ createdAt: 'DESC' })
            .label('SortMessages'),
        }).label('GetMessagesQuery'),
      },
      response: {
        schema: outputOkSchema(messagesForGetWithCountSchema).label('GetMessagesResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/admin/me/chat/{chatId}',
    handler: handlers.getAdminChat,
    options: {
      auth: 'jwt-access',
      id: 'v1.admin.me.getChat',
      description: 'Get chat',
      tags: ['api', 'chat'],
      validate: {
        params: Joi.object({
          chatId: idSchema.required(),
        }).label('GetAdminChatParams'),
      },
      response: {
        schema: outputOkSchema(chatForGetSchema).label('GetAdminChatResponse'),
      },
    },
  },
];
