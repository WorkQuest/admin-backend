import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {AdminController} from "../../controllers/controller.admin";
import {MediaController} from "../../controllers/controller.media";
import {ChatController} from "../../controllers/controller.chat";
import {ChatData, Message} from "@workquest/database-models/lib/models";
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
    console.log('hi')
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
  //
  // const result = await Message.findByPk(message.id);
  //
  // r.server.app.broker.sendChatNotification({
  //   action: ChatNotificationActions.newMessage,
  //   recipients: [r.params.userId],
  //   data: result,
  // });

  return output({result: "result"});
}
