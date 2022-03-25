import {Op} from "sequelize";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {AdminController} from "../../controllers/controller.admin";
import {MediaController} from "../../controllers/controller.media";
import {ChatController} from "../../controllers/controller.chat";
import {
  Chat,
  ChatData,
  ChatMember,
  ChatType, GroupChat, InfoMessage, MemberStatus,
  Message,
  MessageAction,
  QuestChatStatuses
} from "@workquest/database-models/lib/models";
import {markMessageAsReadJob} from "../../jobs/markMessageAsRead";
import {updateCountUnreadAdminChatsJob} from "../../jobs/updateCountUnreadAdminChats";
import {resetUnreadCountMessagesOfAdminMemberJob} from "../../jobs/resetUnreadCountMessagesOfAdminMember";
import {incrementUnreadCountMessageOfAdminMembersJob} from "../../jobs/incrementUnreadCountMessageOfAdminMembers";


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

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatAddUser,
  //   recipients: userIdsInChatWithoutSender,
  //   data: messagesResult,
  // });

  return output(messagesResult);
}

export async function removeUserFromGroupChat(r) {
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

  /** TODO: refactor jobs*/
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

  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.groupChatDeleteUser,
  //   recipients: userIdsWithoutSender,
  //   data: message,
  // });

  return output(message);
}
