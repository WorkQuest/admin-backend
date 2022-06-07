import { literal, Op } from 'sequelize';
import { output } from '../../utils';
import { setMessageAsReadJob } from '../../jobs/setMessageAsRead';
import { updateCountUnreadChatsJob } from '../../jobs/updateCountUnreadChats';
import { updateCountUnreadMessagesJob } from '../../jobs/updateCountUnreadMessages';
//import { listOfAdminsByChatsCountQuery, listOfAdminsByChatsQuery } from '../../queries';
import { resetUnreadCountMessagesOfMemberJob } from '../../jobs/resetUnreadCountMessagesOfMember';

import {
  Chat,
  User,
  Admin,
  Quest,
  Message,
  ChatData,
  QuestChat,
  ChatMember,
  StarredChat,
  MemberStatus,
  StarredMessage,
  SenderMessageStatus,
  ChatMemberDeletionData, ChatType, GroupChat,
} from '@workquest/database-models/lib/models';
import {
  GetChatByIdHandler,
  GetGroupChatHandler,
  GetAdminsByIdHandler,
  GetAdminsByIdsHandler,
  GetMediaByIdsHandler,
  MarkChatStarHandler,
  CreateGroupChatHandler,
  SendMessageToChatHandler,
  SendMessageToAdminHandler,
  GetChatMemberByIdHandler,
  RemoveStarFromChatHandler,
  LeaveFromGroupChatHandler,
  GetChatMessageByIdHandler,
  GetChatMemberByAdminHandler,
  AdminMarkMessageStarHandler,
  AddAdminsInGroupChatHandler,
  RemoveStarFromMessageHandler,
  GetMediasPostValidationHandler,
  GetChatByIdPostValidationHandler,
  GetGroupChatPostValidationHandler,
  DeletedMemberFromGroupChatHandler,
  GetAdminsByIdPostValidationHandler,
  GetChatMemberPostValidationHandler,
  GetAdminsByIdsPostValidationHandler,
  LeaveFromGroupChatPreValidateHandler,
  AddAdminsInGroupChatPreValidateHandler,
  GetChatMessageByIdPostValidatorHandler,
  GetAdminsByIdPostAccessPermissionHandler,
  GetAdminsByIdsPostAccessPermissionHandler,
  LeaveFromGroupChatPreAccessPermissionHandler,
  DeletedMemberFromGroupChatPreValidateHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  AddAdminsInGroupChatPreAccessPermissionHandler,
  GetChatMemberPostLimitedAccessPermissionHandler,
  DeletedMemberFromGroupChatPreAccessPermissionHandler,
} from "../../handlers";
import { updateChatDataJob } from "../../jobs/updateChatData";
import { incrementUnreadCountMessageOfMembersJob } from "../../jobs/incrementUnreadCountMessageOfMembers";

export const searchChatFields = ['name'];

export async function getAdminChats(r) {
  const searchByQuestNameLiteral = literal(
    `(SELECT "title" FROM "Quests" WHERE "id" = ` +
    `(SELECT "questId" FROM "QuestChats" WHERE "chatId" = "Chat"."id")) ` +
    ` ILIKE :query`,
  );
  const searchByFirstAndLastNameLiteral = literal(
    `1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Admins" as "adminMember" ` +
    `INNER JOIN "ChatMembers" AS "member" ON "adminMember"."id" = "member"."adminId" AND "member"."chatId" = "Chat"."id" ` +
    `WHERE "adminMember"."firstName" || ' ' || "adminMember"."lastName" ILIKE :query AND "adminMember"."id" <> :searcherId) THEN 1 ELSE 0 END ) `,
  );

  /**TODO: попытаться сократить запрос*/
  const orderByMessageDateLiteral = literal(
    '(CASE WHEN EXISTS (SELECT "Messages"."createdAt" FROM "ChatMemberDeletionData" INNER JOIN "Messages" ON "beforeDeletionMessageId" = "Messages"."id" ' +
    'INNER JOIN "ChatMembers" ON "ChatMemberDeletionData"."beforeDeletionMessageId" = "ChatMembers"."id" WHERE "ChatMembers"."chatId" = "Chat"."id") ' +
    'THEN (SELECT "Messages"."createdAt" FROM "ChatMemberDeletionData" INNER JOIN "Messages" ON "beforeDeletionMessageId" = "Messages"."id" INNER JOIN "ChatMembers" ON "ChatMemberDeletionData"."beforeDeletionMessageId" = "ChatMembers"."id" WHERE "ChatMembers"."chatId" = "Chat"."id") ' +
    'ELSE (SELECT "Messages"."createdAt" FROM "ChatData" INNER JOIN "Messages" ON "lastMessageId" = "Messages"."id" WHERE "ChatData"."chatId" = "Chat"."id") END)'
  );

  const chatTypeLiteral = literal(
    `("Chat"."type" = '${ ChatType.Private }' OR "Chat"."type" = '${ ChatType.Quest }')`
  )

  const where = {};
  const replacements = {};

  const include: any[] = [{
    model: ChatMember,
    where: { adminId: r.auth.credentials.id },
    include: {
      model: ChatMemberDeletionData,
      as: 'chatMemberDeletionData',
      include: [{
        model: Message.unscoped(),
        as: 'beforeDeletionMessage'
      }]
    },
    required: true,
    as: 'meMember',
  }, {
    model: StarredChat,
    where: { adminId: r.auth.credentials.id },
    as: 'star',
    required: r.query.starred,
  }, {
    model: ChatData,
    as: 'chatData',
    include: [{
      model: Message,
      as: 'lastMessage',
      include: [{
        model: ChatMember,
        as: 'sender',
        include: {
          model: Admin.unscoped(),
          as: 'admin',
          attributes: ["id", "firstName", "lastName"]
        }
      }]
    }]
  }, {
    model: ChatMember,
    as: 'members',
    where: { [Op.and]: [ { adminId: { [Op.ne]: r.auth.credentials.id } }, chatTypeLiteral ] },
    include: [{
      model: Admin.unscoped(),
      as: 'admin',
      attributes: ["id", "firstName", "lastName"],
    }],
    required: false,
  }, {
    model: QuestChat,
    as: 'questChat',
    include: {
      model: Quest.unscoped(),
      as: 'quest',
      attributes: ["id", "title"],
    }
  }, {
    model: GroupChat,
    as: 'groupChat',
  }];

  if (r.query.q) {
    where[Op.or] = searchChatFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    }));

    where[Op.or].push(searchByQuestNameLiteral, searchByFirstAndLastNameLiteral);

    replacements['query'] = `%${r.query.q}%`;
    replacements['searcherId'] = r.auth.credentials.id;
  }

  const { count, rows } = await Chat.findAndCountAll({
    where,
    include,
    replacements,
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [[orderByMessageDateLiteral, r.query.sort.lastMessageDate]],
  });

  return output({ count, chats: rows });
}

export async function getChatMessages(r) {
  const { chatId } = r.params as { chatId: string };
  const meAdmin = r.auth.credentials;

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostLimitedAccessPermissionHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ chat, admin: meAdmin });

  const where = {
    chatId: chat.id,
    ...(meMember.chatMemberDeletionData && { createdAt: {[Op.lte]: meMember.chatMemberDeletionData.beforeDeletionMessage.createdAt }})
  }

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [
      {
        model: StarredMessage,
        as: 'star',
        where: { adminId: meMember.adminId },
        required: r.query.starred,
      },
    ],
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', r.query.sort.createdAt]],
  });

  return output({ count, messages: rows, chat });
}

export async function getAdminChat(r) {
  const { chatId } = r.params as { chatId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  return output(chat);
}

export async function getChatMembers(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ admin: meAdmin, chat });

  const { count, rows } = await ChatMember.unscoped().findAndCountAll({
    distinct: true,
    include: [{
      model: User.scope('shortWithAdditionalInfo'),
      as: 'user',
    }, {
      model: Admin.scope('short'),
      as: 'admin',
    }],
    where: {
      chatId: chat.id,
      status: MemberStatus.Active,
    },
  });

  return output({ count, members: rows });
}

export async function createGroupChat(r) {
  const chatName: string = r.payload.name;
  const chatCreator: Admin = r.auth.credentials;
  const adminIds: string[] = r.payload.adminIds;

  const invitedAdmins: Admin[] = await new GetAdminsByIdsPostValidationHandler(
    new GetAdminsByIdsPostAccessPermissionHandler(
      new GetAdminsByIdsHandler()
    )
  ).Handle({ adminIds });

  const [chat, messageWithInfo] = await new CreateGroupChatHandler(r.server.app.db).Handle({
    chatName,
    chatCreator,
    invitedAdmins,
  });

  await updateChatDataJob({
    chatId: chat.id,
    lastMessageId: messageWithInfo.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
    chatId: chat.id,
    readerMemberId: chat.getDataValue('groupChat').ownerMemberId,
  });

  await setMessageAsReadJob({
    chatId: messageWithInfo.chatId,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
    senderMemberId: chat.getDataValue('groupChat').ownerMemberId,
  });

  const members = chat.getDataValue('members');

  await updateCountUnreadChatsJob({
    members,
  });

  // r.server.app.broker.sendChatNotification({
  //   recipients: adminMemberIds.filter((id) => id !== adminChatOwner.id),
  //   action: ChatNotificationActions.groupChatCreate,
  //   data: chatDto,
  // });

  return output({ chat, infoMessage: messageWithInfo });
}

export async function sendMessageToAdmin(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { adminId } = r.params as { adminId: string };
  const { text, mediaIds } = r.payload as { text: string, mediaIds: string[] }

  const recipientAdmin = await new GetAdminsByIdPostAccessPermissionHandler(
    new GetAdminsByIdPostValidationHandler(
      new GetAdminsByIdHandler()
    )
  ).Handle({ adminId });

  const medias = await new GetMediasPostValidationHandler(
    new GetMediaByIdsHandler()
  ).Handle({ mediaIds });

  const message = await new SendMessageToAdminHandler(r.server.app.db).Handle({
    text,
    medias,
    sender: meAdmin,
    recipient: recipientAdmin,
  });

  const meMember = await new GetChatMemberByAdminHandler().Handle({ admin: meAdmin, chat: message.getDataValue('chat') });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: message.chatId,
    skipMemberIds: [meMember.id],
  });

  const recipientMember = await ChatMember.findOne({
    where: {
      userId: recipientAdmin.id,
      chatId: message.getDataValue('chat').id
    }
  });

  await updateChatDataJob({
    chatId: message.getDataValue('chat').id,
    lastMessageId: message.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: message.chatId,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    chatId: message.chatId,
    lastUnreadMessage: { id: message.id, number: message.number },
    senderMemberId: meMember.id,
  });

  //TODO
  await updateCountUnreadChatsJob({
    members: [meMember, recipientMember],
  });

  // r.server.app.broker.sendChatNotification({
  //   data: message,
  //   action: ChatNotificationActions.newMessage,
  //   recipients: [privateChatController.members.recipientMember.AdminId],
  // });

  return output(message);
}

export async function sendMessageToChat(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };
  const { text, mediaIds } = r.payload as { text: string, mediaIds: string[] };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ admin: meAdmin, chat });

  const medias = await new GetMediasPostValidationHandler(
    new GetMediaByIdsHandler()
  ).Handle({ mediaIds });

  const message = await new SendMessageToChatHandler(r.server.app.db).Handle({
    chat,
    text,
    medias,
    sender: meMember,
  });

  await resetUnreadCountMessagesOfMemberJob({
    memberId: meMember.id,
    chatId,
    lastReadMessage: { id: message.id, number: message.number },
  });
  await incrementUnreadCountMessageOfMembersJob({
    chatId,
    skipMemberIds: [meMember.id],
  });

  await updateChatDataJob({
    chatId,
    lastMessageId: message.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    chatId,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: message.id, number: message.number },
  });

  await updateCountUnreadChatsJob({ members: chat.getDataValue('members') });

  // await updateCountUnreadChatsJob({ adminIds });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.newMessage,
  //   recipients: ,
  //   data: message,
  // });

  return output(message);
}

export async function removeMemberFromGroupChat(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { chatId, adminId } = r.params as { chatId: string, adminId: string };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const member = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByIdHandler()
    )
  ).Handle({ chat: groupChat, id: adminId });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ chat: groupChat, admin: meAdmin });

  const messageWithInfo = await new DeletedMemberFromGroupChatPreAccessPermissionHandler(
    new DeletedMemberFromGroupChatPreValidateHandler(
      new DeletedMemberFromGroupChatHandler(r.server.app.db)
    )
  ).Handle({ member, groupChat, deletionInitiator: meMember });

  await resetUnreadCountMessagesOfMemberJob({
    chatId: groupChat.id,
    memberId: meMember.id,
    lastReadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });

  await incrementUnreadCountMessageOfMembersJob({
    skipMemberIds: [meMember.id],
    chatId: groupChat.id,
  });

  await updateChatDataJob({
    chatId: groupChat.id,
    lastMessageId: messageWithInfo.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
    chatId: messageWithInfo.chatId,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    senderMemberId: meMember.id,
    chatId: groupChat.id,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
      chatId,
      status: MemberStatus.Active,
    }
  });

  await updateCountUnreadChatsJob({ members });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatDeleteAdmin,
  //   recipients: adminIdsWithoutSender,
  //   data: message,
  // });

  return output(messageWithInfo);
}

export async function leaveFromGroupChat(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ chat: groupChat, admin: meAdmin });

  const messageWithInfo = await new LeaveFromGroupChatPreValidateHandler(
    new LeaveFromGroupChatPreAccessPermissionHandler(
      new LeaveFromGroupChatHandler(r.server.app.db)
    )
  ).Handle({ member: meMember, groupChat });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: groupChat.id,
    skipMemberIds: [meMember.id],
  });

  await updateChatDataJob({
    chatId: groupChat.id,
    lastMessageId: messageWithInfo.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
    chatId: messageWithInfo.chatId,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    chatId: groupChat.id,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
      chatId,
      status: MemberStatus.Active,
    }
  });

  await updateCountUnreadChatsJob({ members });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatLeaveAdmin,
  //   recipients: group-chat.members,//adminIdsWithoutSender,
  //   data: result,
  // });

  return output(messageWithInfo);
}

export async function addAdminsInGroupChat(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };
  const { adminIds } = r.payload as { adminIds: string[] };

  const groupChat = await new GetGroupChatPostValidationHandler(
    new GetGroupChatHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostFullAccessPermissionHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ chat: groupChat, admin: meAdmin });

  const admins = await new GetAdminsByIdsPostValidationHandler(
    new GetAdminsByIdsPostAccessPermissionHandler(
      new GetAdminsByIdsHandler()
    )
  ).Handle({ adminIds });

  const messagesWithInfo = await new AddAdminsInGroupChatPreValidateHandler(
    new AddAdminsInGroupChatPreAccessPermissionHandler(
      new AddAdminsInGroupChatHandler(r.server.app.db)
    )
  ).Handle({ groupChat, admins, addInitiator: meMember });

  const lastMessage = messagesWithInfo[messagesWithInfo.length - 1];

  await resetUnreadCountMessagesOfMemberJob({
    chatId: groupChat.id,
    memberId: meMember.id,
    lastReadMessage: { id: lastMessage.id, number: lastMessage.number },
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: groupChat.id,
    skipMemberIds: [meMember.id],
  });

  await updateChatDataJob({
    chatId: groupChat.id,
    lastMessageId: lastMessage.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: lastMessage.id, number: lastMessage.number },
    chatId: groupChat.id,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    chatId: groupChat.id,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: lastMessage.id, number: lastMessage.number }
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
      chatId,
      status: MemberStatus.Active,
    }
  });

  await updateCountUnreadChatsJob({ members });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatAddAdmin,
  //   recipients: adminIdsInChatWithoutSender,
  //   data: messagesResult,
  // });

  return output(messagesWithInfo);
}

export async function setMessagesAsRead(r) {
  const meAdmin: Admin = r.auth.credentials
  const { chatId } = r.params as { chatId: string };
  const { messageId } = r.payload as { messageId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostLimitedAccessPermissionHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ chat, admin: meAdmin });

  const message = await new GetChatMessageByIdPostValidatorHandler(
    new GetChatMessageByIdHandler()
  ).Handle({ messageId, chat });

  const otherSenders = await Message.unscoped().findAll({
    attributes: ['senderMemberId'],
    where: {
      chatId: chat.id,
      senderMemberId: { [Op.ne]: meMember.id },
      senderStatus: SenderMessageStatus.Unread,
      number: { [Op.gte]: message.number },
    },
    group: ['senderMemberId'],
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chat.id,
    readerMemberId: chat.meMember.id,
  });

  if (otherSenders.length === 0) {
    return output();
  }

  await setMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: meMember.id,
  });

  // await updateCountUnreadMessagesJob({
  //   lastUnreadMessage: { id: message.id, number: message.number },
  //   chatId: chat.id,
  //   readerMemberId: chat.meMember.id,
  // });
  //
  // if (otherSenders.length === 0) {
  //   return output();
  // }
  //
  // await setMessageAsReadJob({
  //   lastUnreadMessage: { id: message.id, number: message.number },
  //   chatId: r.params.chatId,
  //   senderMemberId: meMember.id,
  // });
  // await updateCountUnreadChatsJob({
  //   adminIds: [r.auth.credentials.id],
  // });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.messageReadByRecipient,
  //   recipients: otherSenders.map((sender) => sender.senderMemberId),
  //   data: message,
  // });

  return output();
}

export async function getAdminStarredMessages(r) {
  const { count, rows } = await Message.findAndCountAll({
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    include: [
      {
        model: StarredMessage,
        as: 'star',
        where: { adminId: r.auth.credentials.id },
        required: true,
      },
      {
        model: Chat.unscoped(),
        as: 'chat',
      },
    ],
  });

  return output({ count, messages: rows });
}

export async function markMessageStar(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { chatId, messageId } = r.params as { chatId: string, messageId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  const meMember = await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostLimitedAccessPermissionHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ chat, admin: meAdmin });

  const message = await new GetChatMessageByIdPostValidatorHandler(
    new GetChatMessageByIdHandler()
  ).Handle({ messageId, chat });

  await new AdminMarkMessageStarHandler().Handle({ admin: meAdmin, message });

  return output();
}

export async function removeStarFromMessage(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { messageId } = r.params as { messageId: string };

  await new RemoveStarFromMessageHandler().Handle({ admin: meAdmin, messageId });

  return output();
}

export async function markChatStar(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  const chat = await new GetChatByIdPostValidationHandler(
    new GetChatByIdHandler()
  ).Handle({ chatId });

  await new GetChatMemberPostValidationHandler(
    new GetChatMemberPostLimitedAccessPermissionHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ chat, admin: meAdmin });

  await new MarkChatStarHandler().Handle({ chat, admin: meAdmin });

  return output();
}

export async function removeStarFromChat(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { chatId } = r.params as { chatId: string };

  await new RemoveStarFromChatHandler().Handle({ admin: meAdmin, chatId });

  return output();
}
