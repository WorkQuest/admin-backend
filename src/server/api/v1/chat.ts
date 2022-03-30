import {literal, Op} from "sequelize";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {AdminController} from "../../controllers/controller.admin";
import {MediaController} from "../../controllers/controller.media";
import {ChatController} from "../../controllers/chat/controller.chat";
import {
  Admin,
  Chat,
  ChatData,
  ChatMember,
  ChatMemberDeletionData,
  ChatType,
  GroupChat,
  InfoMessage,
  MemberStatus,
  Message,
  MessageAction,
  QuestChatStatuses, SenderMessageStatus, StarredChat, StarredMessage
} from "@workquest/database-models/lib/models";
import {markMessageAsReadJob} from "../../jobs/markMessageAsRead";
import {updateCountUnreadAdminChatsJob} from "../../jobs/updateCountUnreadAdminChats";
import {updateCountUnreadAdminMessagesJob} from "../../jobs/updateCountUnreadAdminMessages"
import {resetUnreadCountMessagesOfAdminMemberJob} from "../../jobs/resetUnreadCountMessagesOfAdminMember";
import {incrementUnreadCountMessageOfAdminMembersJob} from "../../jobs/incrementUnreadCountMessageOfAdminMembers";

export const searchChatFields = ['name'];

export async function sendMessageToAdmin(r) {
  if (r.params.adminId === r.auth.credentials.id) {
    return error(Errors.InvalidPayload, "You can't send a message to yourself", {});
  }

  await AdminController.adminMustExists(r.params.adminId);

  const medias = await MediaController.getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const chatController = await ChatController.findOrCreatePrivateChat(r.auth.credentials.id, r.params.adminId, transaction);

  const lastMessage = await Message.findOne({
    order: [['createdAt', 'DESC']],
    where: { chatId: chatController.controller.chat.id },
  });

  const messageNumber = lastMessage ? (lastMessage.number + 1) : 1;

  const meMember = chatController.controller.chat.getDataValue('members').find(member => member.adminId === r.auth.credentials.id);

  const message = await chatController.controller.createMessage(chatController.controller.chat.id, meMember.id, messageNumber, r.payload.text, transaction);

  await message.$set('medias', medias, { transaction });

  if (chatController.isCreated) {
    await chatController.controller.createChatMembersData(chatController.controller.chat.getDataValue('members'), r.auth.credentials.id, message, transaction);
    await chatController.controller.createChatData(chatController.controller.chat.id, message.id, transaction);
  } else {
    await ChatData.update({ lastMessageId: message.id }, { where: { chatId: chatController.controller.chat.id }, transaction });
  }

  await transaction.commit();

  if (!chatController.isCreated) {
    await resetUnreadCountMessagesOfAdminMemberJob({
      chatId: chatController.controller.chat.id,
      lastReadMessageId: message.id,
      memberId: meMember.id,
      lastReadMessageNumber: message.number,
    })

    await incrementUnreadCountMessageOfAdminMembersJob({
      chatId: chatController.controller.chat.id,
      notifierMemberId: meMember.id,
    });
  }

  await markMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chatController.controller.chat.id,
    senderMemberId: meMember.id,
  });

  await updateCountUnreadAdminChatsJob({
    adminIds: [r.auth.credentials.id, r.params.adminId],
  });

  const result = await Message.findByPk(message.id);

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.newMessage,
  //   recipients: [r.params.userId],
  //   data: result,
  // });

  return output(result);
}

export async function createGroupChat(r) {
  const adminIds: string[] = r.payload.adminIds;

  if (!adminIds.includes(r.auth.credentials.id)) {
    adminIds.push(r.auth.credentials.id);
  }

  await AdminController.adminsMustExist(adminIds);

  const transaction = await r.server.app.db.transaction();

  const chatController = await ChatController.createGroupChat(adminIds, r.payload.name, r.auth.credentials.id, transaction);

  const meMember = chatController.chat.getDataValue('members').find(member => member.adminId === r.auth.credentials.id);

  const message = await chatController.createInfoMessage(meMember.id, chatController.chat.id, 1, meMember.id, MessageAction.groupChatCreate, transaction);
  await chatController.createChatMembersData(chatController.chat.getDataValue('members'), r.auth.credentials.id, message, transaction);
  await chatController.createChatData(chatController.chat.id, message.id, transaction);

  await transaction.commit();

  const result = await Chat.findByPk(chatController.chat.id);

  await updateCountUnreadAdminChatsJob({ adminIds: adminIds });

  // r.server.app.broker.sendChatNotification({
  //   recipients: adminIds.filter((userId) => userId !== r.auth.credentials.id),
  //   action: ChatNotificationActions.groupChatCreate,
  //   data: result, // TODO lastReadMessageId: message.id
  // });

  return output(result);
}

export async function sendMessageToChat(r) {
  const medias = await MediaController.getMedias(r.payload.medias);
  const chat = await Chat.findByPk(r.params.chatId, {
    include: [
      {
        model: ChatData,
        as: 'chatData'
      },
      {
        model: ChatMember,
        as: 'meMember',
        where: { adminId: r.auth.credentials.id }
      }]
  });

  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  if (chat.type === ChatType.quest) {
    chatController.questChatMastHaveStatus(QuestChatStatuses.Open);
  }

  const transaction = await r.server.app.db.transaction();

  const messageNumber = chat.chatData.lastMessage.number + 1;

  const message = await chatController.createMessage(chatController.chat.id, chatController.chat.meMember.id, messageNumber, r.payload.text, transaction);
  await message.$set('medias', medias, { transaction });

  await chat.chatData.update({ lastMessageId: message.id }, { transaction });

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, adminId: { [Op.ne]: r.auth.credentials.id } },
  });

  const adminIdsWithoutSender = membersWithoutSender.map((member) => member.adminId);
  const result = await Message.findByPk(message.id);

  await resetUnreadCountMessagesOfAdminMemberJob({
    chatId: chat.id,
    lastReadMessageId: message.id,
    memberId: chatController.chat.getDataValue('meMember').id,
    lastReadMessageNumber: message.number,
  });

  await incrementUnreadCountMessageOfAdminMembersJob({
    chatId: chat.id,
    notifierMemberId: [chatController.chat.meMember.id],
  });

  await markMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: chatController.chat.meMember.id,
  });

  await updateCountUnreadAdminChatsJob({
    adminIds: [r.auth.credentials.id, ...adminIdsWithoutSender],
  });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.newMessage,
  //   recipients: userIdsWithoutSender,
  //   data: result,
  // });

  return output(result);
}

export async function addAdminsInGroupChat(r) {
  const adminIds: string[] = r.payload.adminIds;
  await AdminController.adminsMustExist(adminIds);

  const chat = await Chat.findByPk(r.params.chatId, {
    include: [
      {
        model: ChatMember,
        as: 'meMember',
        where: { adminId: r.auth.credentials.id }
      },
      {
        model: ChatData,
        as: 'chatData',
      },
      {
        model: GroupChat,
        as: 'groupChat',
      }

    ]
  });
  const chatController = new ChatController(chat);

  await chatController
    .chatMustHaveType(ChatType.group)
    .chatMustHaveOwner(chat.meMember.id)
    .adminsNotExistInGroupChat(adminIds);

  const transaction = await r.server.app.db.transaction();

  const newMembers = await chatController.createChatMembers(adminIds, chat.id, transaction);

  const messages: Message[] = [];
  for (let i = 0; i < newMembers.length; i++) {
    const memberId = newMembers[i].id;
    const messageNumber = chat.chatData.lastMessage.number + 1;

    const message = await chatController.createInfoMessage(chatController.chat.meMember.id, chatController.chat.id, messageNumber, memberId, MessageAction.groupChatAddUser, transaction);

    messages.push(message);
  }

  const lastMessage = messages[messages.length - 1];
  await chatController.createChatMembersData(newMembers, r.auth.credentials.id, lastMessage, transaction);

  await chat.chatData.update({ lastMessageId: lastMessage.id }, { transaction } );

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, adminId: { [Op.ne]: r.auth.credentials.id } },
  });

  const chatMembers = await ChatMember.findAll({ where: { chatId: chat.id, status: MemberStatus.Active }});

  const adminIdsInChatWithoutSender = membersWithoutSender.map((member) => member.adminId);

  const messagesResult = messages.map((message) => {
    const keysMessage: { [key: string]: any } = message.toJSON();
    const keysInfoMessage = message.getDataValue('infoMessage').toJSON() as InfoMessage;

    keysInfoMessage.member = chatMembers.find((_) => _.id === keysInfoMessage.memberId).toJSON() as ChatMember;

    keysMessage.infoMessage = keysInfoMessage;

    return keysMessage;
  }) as Message[];

  const newMembersIds = newMembers.map(member => { return member.id });

  await resetUnreadCountMessagesOfAdminMemberJob({
    chatId: chat.id,
    lastReadMessageId: lastMessage.id,
    memberId: chatController.chat.meMember.id,
    lastReadMessageNumber: lastMessage.number,
  });

  await incrementUnreadCountMessageOfAdminMembersJob({
    chatId: chat.id,
    notifierMemberId: [chatController.chat.meMember.id, ...newMembersIds] //у тех, кого добавили уже будет одно непрочитанное, не нужно его увеличивать ещё на один
  });

  await updateCountUnreadAdminChatsJob({
    adminIds: [r.auth.credentials.id, ...adminIdsInChatWithoutSender],
  });

  await markMessageAsReadJob({
    lastUnreadMessage: { id: lastMessage.id, number: lastMessage.number },
    chatId: r.params.chatId,
    senderMemberId: chat.meMember.id,
  });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatAddUser,
  //   recipients: userIdsInChatWithoutSender,
  //   data: messagesResult,
  // });

  return output(messagesResult);
}

export async function removeAdminFromGroupChat(r) {
  await AdminController.adminMustExists(r.params.adminId);

  const chat = await Chat.findByPk(r.params.chatId, {
    include: [
      {
        model: ChatMember,
        as: 'members',
      },
      {
        model: ChatData,
        as: 'chatData',
      },
      {
        model: GroupChat,
        as: 'groupChat',
      },
      {
        model: ChatMember,
        as: 'meMember',
        where: { adminId: r.auth.credentials.id }
      }
    ]
  });
  const chatController = new ChatController(chat);

  await chatController
    .chatMustHaveOwner(chat.meMember.id)
    .chatMustHaveType(ChatType.group)
    .chatMustHaveMember(r.params.adminId);

  const transaction = await r.server.app.db.transaction();

  const removedChatMember = chatController.chat.members.find(member => member.adminId === r.params.adminId);

  const messageNumber = chat.chatData.lastMessage.number + 1;

  const message = await chatController.createInfoMessage(chat.meMember.id, chatController.chat.id, messageNumber, removedChatMember.id, MessageAction.groupChatDeleteUser, transaction);

  await chat.chatData.update({ lastMessageId: message.id }, { transaction });

  await chatController.createChatMemberDeletionData(removedChatMember.id, message.id, message.number, transaction);

  await transaction.commit();

  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.id, adminId: { [Op.ne]: r.auth.credentials.id } },
  });

  const adminIdsWithoutSender = membersWithoutSender.map((member) => member.adminId);

  await resetUnreadCountMessagesOfAdminMemberJob({
    chatId: chat.id,
    lastReadMessageId: message.id,
    memberId: chat.meMember.id,
    lastReadMessageNumber: message.number,
  });

  await incrementUnreadCountMessageOfAdminMembersJob({
    chatId: chat.id,
    notifierMemberId: [chat.meMember.id],
  });

  await updateCountUnreadAdminChatsJob({
    adminIds: [r.auth.credentials.id, ...adminIdsWithoutSender],
  });

  await markMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: chat.meMember.id,
  });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatDeleteUser,
  //   recipients: userIdsWithoutSender,
  //   data: message,
  // });

  return output(message);
}

export async function leaveFromGroupChat(r) {
  const chat = await Chat.findByPk(r.params.chatId, {
    include: [{
      model: GroupChat,
      as: 'groupChat',
    }, {
      model: ChatData,
      as: 'chatData',
    }, {
      model: ChatMember,
      as: 'members',
      where: {
        adminId: { [Op.ne]: r.auth.credentials.id }
      }
    }, {
      model: ChatMember,
      as: 'meMember',
      where: { adminId: r.auth.credentials.id },
    }]
  });
  const chatController = new ChatController(chat);

  if (chat.groupChat.ownerMemberId === chat.meMember.id) {
    return error(Errors.Forbidden, 'Admin is chat owner', {});
  }

  await chatController
    .chatMustHaveType(ChatType.group)
    .chatMustHaveMember(r.auth.credentials.id);

  const transaction = await r.server.app.db.transaction();

  const messageNumber = chat.chatData.lastMessage.number + 1;
  const message = await chatController.createInfoMessage(chatController.chat.meMember.id, chatController.chat.id, messageNumber, chatController.chat.meMember.id, MessageAction.groupChatLeaveUser, transaction);

  await chatController.chat.chatData.update({ lastMessageId: message.id }, { transaction });

  await chatController.createChatMemberDeletionData(chat.meMember.id, message.id, message.number, transaction);

  await transaction.commit();

  const result = await Message.findByPk(message.id);
  const membersWithoutSender = await ChatMember.scope('userIdsOnly').findAll({
    where: { chatId: chat.groupChat.id, adminId: { [Op.ne]: r.auth.credentials.id } },
  });
  const adminIdsWithoutSender = membersWithoutSender.map((member) => member.adminId);

  await incrementUnreadCountMessageOfAdminMembersJob({
    chatId: chat.id,
    notifierMemberId: [chat.meMember.id],
  });

  await updateCountUnreadAdminChatsJob({
    adminIds: [r.auth.credentials.id, ...adminIdsWithoutSender],
  });

  await markMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: chat.meMember.id,
  });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatLeaveUser,
  //   recipients: chat.members,//userIdsWithoutSender,
  //   data: result,
  // });

  return output(result);
}

export async function setMessagesAsRead(r) {
  const chat = await Chat.findByPk(r.params.chatId, {
    include: [{
      model: ChatMember,
      as: 'meMember',
      where: { adminId: r.auth.credentials.id }
    }]
  });
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const message = await Message.findByPk(r.payload.messageId);

  if (!message) {
    return error(Errors.NotFound, 'Message is not found', {});
  }

  const otherSenders = await Message.unscoped().findAll({
    attributes: ['senderMemberId'],
    where: {
      chatId: chatController.chat.id,
      senderMemberId: { [Op.ne]: chat.meMember.id },
      senderStatus: SenderMessageStatus.unread,
      number: { [Op.gte]: message.number },
    },
    group: ['senderMemberId'],
  });

  await updateCountUnreadAdminMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chat.id,
    readerMemberId: chat.meMember.id,
  });

  if (otherSenders.length === 0) {
    return output();
  }

  await markMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: chat.meMember.id,
  });

  await updateCountUnreadAdminChatsJob({
    adminIds: [r.auth.credentials.id],
  });

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.messageReadByRecipient,
  //   recipients: otherSenders.map((sender) => sender.senderMemberId),
  //   data: message,
  // });

  return output();
}

export async function markMessageStar(r) {
  const chat = await Chat.findByPk(r.params.chatId);

  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  await StarredMessage.findOrCreate({
    where: {
      adminId: r.auth.credentials.id,
      messageId: r.params.messageId,
    },
    defaults: {
      adminId: r.auth.credentials.id,
      messageId: r.params.messageId,
    }
  });

  return output();
}

export async function removeStarFromMessage(r) {
  const starredMessage = await StarredMessage.findOne({
    where: {
      messageId: r.params.messageId,
      adminId: r.auth.credentials.id,
    },
  });

  if (!starredMessage) {
    return error(Errors.Forbidden, 'Message or message with star not fount', {});
  }

  await starredMessage.destroy();

  return output();
}

export async function markChatStar(r) {
  const chat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  await StarredChat.findOrCreate({
    where: {
      adminId: r.auth.credentials.id,
      chatId: r.params.chatId,
    },
    defaults: {
      adminId: r.auth.credentials.id,
      chatId: r.params.chatId,
    }
  });

  return output();
}

export async function removeStarFromChat(r) {
  await ChatController.chatMustExists(r.params.chatId);

  await StarredChat.destroy({
    where: {
      chatId: r.params.chatId,
      adminId: r.auth.credentials.id,
    },
  });

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

export async function getChatMembers(r) {
  const exceptDeletedAdminsLiteral = literal(
    '(1 = (CASE WHEN EXISTS (SELECT "chatMemberId" FROM "ChatMemberDeletionData" INNER JOIN "ChatMembers" ON "Admin"."id" = "ChatMembers"."adminId" WHERE "ChatMemberDeletionData"."chatMemberId" = "ChatMembers"."id") THEN 0 ELSE 1 END))'
  );

  const where = {};
  where[Op.or] = exceptDeletedAdminsLiteral;

  const chat = await Chat.findByPk(r.params.chatId);
  const chatController = new ChatController(chat);
  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const { count, rows } = await Admin.findAndCountAll({
    include: [
      {
        model: ChatMember,
        attributes: [],
        as: 'chatMember',
        where: { chatId: chat.id },
        include: [{
          model: ChatMemberDeletionData,
          as: 'chatMemberDeletionData'
        }]
      },
    ],
    where,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, members: rows });
}

export async function getAdminChats(r) {
  const searchByQuestNameLiteral = literal(
    `(SELECT "title" FROM "Quests" WHERE "id" = ` + `(SELECT "questId" FROM "QuestChats" WHERE "chatId" = "Chat"."id")) ` + `ILIKE :query`,
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
      as: 'lastMessage'
    }]
  }
  ];

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
  const chat = await Chat.findByPk(r.params.chatId, {
    include: {
      model: ChatMember,
      where: { adminId: r.auth.credentials.id },
      include: [{
        model: ChatMemberDeletionData,
        include: [{
          model: Message.unscoped(),
          as: 'beforeDeletionMessage'
        }],
        as: 'chatMemberDeletionData'
      }],
      required: false,
      as: 'meMember',
    },
  });
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  const where = {
    chatId: chat.id,
    ...(chat.meMember.chatMemberDeletionData && {createdAt: {[Op.lte]: chat.meMember.chatMemberDeletionData.beforeDeletionMessage.createdAt}})
  }

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [
      {
        model: StarredMessage,
        as: 'star',
        where: { adminId: r.auth.credentials.id },
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
  const chat = await Chat.findByPk(r.params.chatId, {
    include: {
      model: StarredChat,
      as: 'star',
      required: false,
    },
  });
  const chatController = new ChatController(chat);

  await chatController.chatMustHaveMember(r.auth.credentials.id);

  return output(chat);
}
