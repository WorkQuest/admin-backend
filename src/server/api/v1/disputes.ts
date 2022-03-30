import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {
  Chat,
  User,
  Admin,
  Quest,
  QuestDispute,
  DisputeStatus,
  QuestDisputeReview, ChatMember, QuestChat, MessageAction, ChatData, GroupChat,
} from "@workquest/database-models/lib/models";
import {Op} from 'sequelize'
import {QuestNotificationActions} from "../../controllers/controller.broker";
import {saveAdminActionsMetadataJob} from "../../jobs/saveAdminActionsMetadata";
import {incrementAdminDisputeStatisticJob} from "../../jobs/incrementAdminDisputeStatistic";
import {ChatController} from "../../controllers/chat/controller.chat";
import {addJob} from "../../utils/scheduler";
import {updateCountUnreadAdminChatsJob} from "../../jobs/updateCountUnreadAdminChats";
import {incrementUnreadCountMessageOfAdminMembersJob} from "../../jobs/incrementUnreadCountMessageOfAdminMembers";
import {markMessageAsReadJob} from "../../jobs/markMessageAsRead";

export async function getQuestDispute(r) {
  const dispute = await QuestDispute.findOne({
    where: { questId: r.params.questId },
  });

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute not found', {});
  }

  return output(dispute);
}

export async function getQuestDisputes(r) {
  const where = {
    ...(r.params.adminId && { assignedAdminId: r.params.adminId }),
    ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
    ...(r.params.userId && { [Op.or]: { opponentUserId: r.params.userId, openDisputeUserId: r.params.userId } }),
  }

  const { count, rows } = await QuestDispute.findAndCountAll({
    where,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}

export async function takeDisputeToResolve(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }
  if (dispute.status !== DisputeStatus.pending) {
    throw error(Errors.InvalidStatus, 'Invalid status', {});
  }

  const transaction = await r.server.app.db.transaction();


  await dispute.update({
    status: DisputeStatus.inProgress,
    acceptedAt: Date.now(),
    assignedAdminId: r.auth.credentials.id,
  }, { transaction });

  const questChat = await QuestChat.findOne({
    where: {
      questId: dispute.questId,
    },
    include: [{
      model: Quest,
      as: 'quest',
    }, {
      model: ChatMember,
      as: 'employer',
    }, {
      model: ChatMember,
      as: 'worker',
    }, {
      model: Chat,
      as: 'chat',
      include: [{
        model: ChatData,
        as: 'chatData'
      }]
    }],
    transaction
  });

  const chatController = new ChatController(questChat.chat);

  const newMember = await chatController.createChatMembers([r.auth.credentials.id], questChat.chatId, transaction);

  const messageNumber = chatController.chat.chatData.lastMessage.number + 1;

  const message = await chatController.createInfoMessage(newMember[0].id, chatController.chat.id, messageNumber, newMember[0].id, MessageAction.groupChatAddUser, transaction);

  await chatController.createChatMembersData(newMember, newMember[0].id, message, transaction);

  await questChat.chat.chatData.update({ lastMessageId: message.id }, { transaction } );

  await questChat.update({ adminMemberId: newMember[0].id });

  await transaction.commit();

  await addJob('incrementUnreadCountMessageOfMembersJob',{
    chatId: questChat.chat.id,
    notifierMemberId: newMember, //admin adds in chat by itself
  });

  await addJob('updateCountUnreadAdminChatsJob',{
    userIds: [questChat.employerMemberId, questChat.workerMemberId],
  });

  await addJob('resetUnreadCountMessagesOfMemberJob',{
    chatId: questChat.chat.id,
    lastReadMessageId: message.id,
    memberId: newMember[0].id,
    lastReadMessageNumber: message.number,
  });

  await addJob('setMessageAsReadJob',{
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: newMember[0].id,
  });

  await updateCountUnreadAdminChatsJob({
    adminIds: [r.auth.credentials.id],
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output(questChat); //dispute
}

export async function disputeDecide(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }
  if (dispute.assignedAdminId !== r.auth.credentials.id) {
    throw error(Errors.Forbidden, 'You are not an assigned administrator', {});
  }
  if (dispute.status !== DisputeStatus.inProgress) {
    throw error(Errors.InvalidStatus, 'Invalid status', {});
  }

  const transaction = await r.server.app.db.transaction();

  const questChat = await QuestChat.findOne({
    where: {
      questId: dispute.questId,
    },
    include: [{
      model: Quest,
      as: 'quest',
    }, {
      model: ChatMember,
      as: 'employer',
    }, {
      model: ChatMember,
      as: 'worker',
    }, {
      model: ChatMember,
      as: 'admin',
    }, {
      model: Chat,
      as: 'chat',
      include: [{
        model: ChatData,
        as: 'chatData'
      }]
    }],
    transaction
  });

  const chatController = new ChatController(questChat.chat);

  await dispute.update({
    resolvedAt: Date.now(),
    status: DisputeStatus.closed,
    decisionDescription: r.payload.decisionDescription,
  }, {transaction});

  await Quest.update({ status: dispute.openOnQuestStatus }, { where: { id: dispute.questId }, transaction });

  const messageNumber = questChat.chat.chatData.lastMessage.number + 1;

  const message = await chatController.createInfoMessage(questChat.admin.id, chatController.chat.id, messageNumber, questChat.admin.id, MessageAction.groupChatDeleteUser, transaction);

  await questChat.chat.chatData.update({ lastMessageId: message.id }, { transaction });

  await chatController.createChatMemberDeletionData(questChat.admin.id, message.id, message.number, transaction);

  await transaction.commit();

  await addJob('resetUnreadCountMessagesOfMemberJob', {
    chatId: questChat.chat.id,
    lastReadMessageId: message.id,
    memberId: questChat.admin.id,
    lastReadMessageNumber: message.number,
  });

  await addJob('incrementUnreadCountMessageOfAdminMembersJob',{
    chatId: questChat.chat.id,
    notifierMemberId: [questChat.admin.id],
  });

  await addJob('updateCountUnreadChatsJob', {
    adminIds: [questChat.employerMemberId, questChat.workerMemberId],
  });

  await markMessageAsReadJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: r.params.chatId,
    senderMemberId: questChat.admin.id,
  });

  const resolutionTimeInSeconds: number = (dispute.resolvedAt.getTime() - dispute.acceptedAt.getTime())/1000;

  await incrementAdminDisputeStatisticJob({
    adminId: dispute.assignedAdminId,
    resolutionTimeInSeconds,
  });

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.DisputeDecision,
    recipients: [dispute.openDisputeUserId, dispute.opponentUserId],
    data: dispute
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output(await QuestDispute.findByPk(dispute.id));
}

export async function getQuestDisputeReviews(r) {
  const where = {
    ...(r.params.adminId && { toAdminId: r.params.adminId }),
    ...(r.params.disputeId && { disputeId: r.params.disputeId }),
  };

  const include = [{
    model: User,
    as: 'fromUser',
  }, {
    model: Admin,
    as: 'toAdmin',
  }, {
    model: QuestDispute,
    where: {...r.params.questId && { questId: r.params.questId } },
    as: 'dispute',
  }];

  const { count, rows } = await QuestDisputeReview.findAndCountAll({
    where,
    include,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, reviews: rows });
}

export async function getQuestDisputeReviewsForAdminMe(r) {
  const include = [{
    model: User,
    as: 'fromUser',
  }, {
    model: Admin,
    as: 'toAdmin',
  }, {
    model: QuestDispute,
    as: 'dispute',
  }];

  const {count, rows} = await QuestDisputeReview.findAndCountAll({
    include,
    limit: r.query.limit,
    offset: r.query.offset,
    where: { toAdminId: r.auth.credentials.id },
  });

  return output({ count, reviews: rows });
}
