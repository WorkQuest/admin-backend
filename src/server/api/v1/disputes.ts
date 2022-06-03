import { literal, Op } from 'sequelize'
import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import { saveAdminActionsMetadataJob } from "../../jobs/saveAdminActionsMetadata";
import {
  LeaveFromQuestChatHandler,
  GetChatMemberByAdminHandler,
  AddAdminsInQuestChatHandler,
  GetChatMemberPostValidationHandler,
  LeaveFromQuestChatPreValidateHandler,
  AddAdminsInQuestChatPreValidateHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  LeaveFromQuestChatPreAccessPermissionHandler,
  AddAdminsInQuestChatPreAccessPermissionHandler,
} from "../../handlers";
import {
  User,
  Chat,
  Admin,
  Quest,
  QuestChat,
  ChatMember,
  QuestDispute,
  MemberStatus,
  DisputeStatus,
  QuestDisputeReview,
} from "@workquest/database-models/lib/models";
import { resetUnreadCountMessagesOfMemberJob } from "../../jobs/resetUnreadCountMessagesOfMember";
import { incrementUnreadCountMessageOfMembersJob } from "../../jobs/incrementUnreadCountMessageOfMembers";
import { updateChatDataJob } from "../../jobs/updateChatData";
import { updateCountUnreadMessagesJob } from "../../jobs/updateCountUnreadMessages";
import { setMessageAsReadJob } from "../../jobs/setMessageAsRead";
import { updateCountUnreadChatsJob } from "../../jobs/updateCountUnreadChats";
import {
  GetQuestDisputeByIdHandler,
  GetQuestDisputeByIdPostValidationHandler
} from "../../handlers/quest/dispute/GetQuestDisputeByIdHandler";


export async function getQuestDispute(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId, {
    include: [{
      model: Quest,
      as: 'quest',
      include: [{
        model: QuestChat.scope('idsOnly'),
        as: 'questChat',
        on: literal('"QuestDispute"."assignedAdminId" = $adminId'),
        attributes: {
          exclude: ['id', 'status', 'createdAt', 'updatedAt'],
          include: [[literal('CASE WHEN "chatId" IS NULL THEN NULL ELSE "chatId" END'), 'chatId']],
        },
        required: false
      }]
    }],
    bind: { adminId: r.auth.credentials.id }
  });

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute not found', {});
  }

  return output(dispute);
}

export async function getQuestDisputes(r) {
  const where = {
    ...(r.params.questId && { questId: r.params.questId }),
    ...(r.params.adminId && { assignedAdminId: r.params.adminId }),
    ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
    ...(r.params.userId && { [Op.or]: { opponentUserId: r.params.userId, openDisputeUserId: r.params.userId } }),
  }

  const { count, rows } = await QuestDispute.findAndCountAll({
    distinct: true,
    col: "QuestDispute.id",
    where,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}

export async function takeDisputeToResolve(r) {
  const { disputeId } = r.params as { disputeId: string }

  const dispute = await new GetQuestDisputeByIdPostValidationHandler(
    new GetQuestDisputeByIdHandler()
  ).Handle({ disputeId })

  // if (!dispute) {
  //   return error(Errors.NotFound, 'Dispute is not found', {});
  // }
  // if (dispute.status !== DisputeStatus.Created) {
  //   throw error(Errors.InvalidStatus, 'Invalid status', {});
  // }

  const questChat = await QuestChat.findOne({
    where: {
      questId: dispute.questId,
      employerId: { [Op.or]: [dispute.openDisputeUserId, dispute.opponentUserId] },
      workerId: { [Op.or]: [dispute.openDisputeUserId, dispute.opponentUserId] },
    },
    include: {
      model: Chat,
      as: 'chat',
    }
  });

  const messagesWithInfo = await new AddAdminsInQuestChatPreValidateHandler(
    new AddAdminsInQuestChatPreAccessPermissionHandler(
      new AddAdminsInQuestChatHandler(r.server.app.db)
    )
  ).Handle({ questChat: questChat.chat, admin: r.auth.credentials as Admin });

  await dispute.update({
    status: DisputeStatus.InProgress,
    acceptedAt: Date.now(),
    assignedAdminId: r.auth.credentials.id,
  });

  const meMember = await ChatMember.findOne({
    where: {
      chatId: questChat.chat.id,
      adminId: r.auth.credentials.id,
    }
  });

  await resetUnreadCountMessagesOfMemberJob({
    chatId: questChat.chat.id,
    memberId: meMember.id,
    lastReadMessage: { id: messagesWithInfo.id, number: messagesWithInfo.number },
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: questChat.chat.id,
    skipMemberIds: [meMember.id],
  });

  await updateChatDataJob({
    chatId: questChat.chat.id,
    lastMessageId: messagesWithInfo.id,
  });

  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: messagesWithInfo.id, number: messagesWithInfo.number },
    chatId: questChat.chat.id,
    readerMemberId: meMember.id,
  });

  await setMessageAsReadJob({
    chatId: questChat.chat.id,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: messagesWithInfo.id, number: messagesWithInfo.number }
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
      chatId: questChat.chat.id,
      status: MemberStatus.Active,
    }
  });

  await updateCountUnreadChatsJob({ members });

  await saveAdminActionsMetadataJob({
    path: r.path,
    HTTPVerb: r.method,
    adminId: r.auth.credentials.id,
  });

  return output(dispute);
}

export async function disputeDecide(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  if (dispute.assignedAdminId !== r.auth.credentials.id) {
    throw error(Errors.Forbidden, 'You are not an assigned administrator', {});
  }

  if (dispute.status !== DisputeStatus.InProgress) {
    throw error(Errors.InvalidStatus, 'Invalid status', {});
  }

  const questChat = await QuestChat.findOne({
    where: {
      questId: dispute.questId,
      employerId: { [Op.or]: [dispute.openDisputeUserId, dispute.opponentUserId] },
      workerId: { [Op.or]: [dispute.openDisputeUserId, dispute.opponentUserId] },
    },
    include: {
      model: Chat,
      as: 'chat',
    }
  });

  const meMember = await new GetChatMemberPostFullAccessPermissionHandler(
    new GetChatMemberPostValidationHandler(
      new GetChatMemberByAdminHandler()
    )
  ).Handle({ chat: questChat.chat, admin: r.auth.credentials });

  const messageWithInfo = await new LeaveFromQuestChatPreValidateHandler(
    new LeaveFromQuestChatPreAccessPermissionHandler(
      new LeaveFromQuestChatHandler(r.server.app.db)
    )
  ).Handle({ member: meMember, questChat: questChat.chat });

  await dispute.update({
    decisionDescription: r.payload.decisionDescription,
  });

  await incrementUnreadCountMessageOfMembersJob({
    chatId: questChat.chat.id,
    skipMemberIds: [meMember.id],
  });

  await updateChatDataJob({
    chatId: questChat.chat.id,
    lastMessageId: messageWithInfo.id,
  });

  await setMessageAsReadJob({
    chatId: questChat.chat.id,
    senderMemberId: meMember.id,
    lastUnreadMessage: { id: messageWithInfo.id, number: messageWithInfo.number },
  });

  //TODO: переделать
  const members = await ChatMember.findAll({ where: {
      chatId: questChat.chat.id,
      status: MemberStatus.Active,
    }
  });

  await updateCountUnreadChatsJob({ members });

  await saveAdminActionsMetadataJob({
    path: r.path,
    HTTPVerb: r.method,
    adminId: r.auth.credentials.id,
  });

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
    required: true,
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
  const { count, rows } = await QuestDisputeReview.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    where: { toAdminId: r.auth.credentials.id },
  });

  return output({ count, reviews: rows });
}
