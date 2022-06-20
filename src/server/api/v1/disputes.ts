import { literal, Op } from 'sequelize'
import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import { updateChatDataJob } from "../../jobs/updateChatData";
import { setMessageAsReadJob } from "../../jobs/setMessageAsRead";
import { updateCountUnreadChatsJob } from "../../jobs/updateCountUnreadChats";
import { QuestNotificationActions } from "../../controllers/controller.broker";
import { saveAdminActionsMetadataJob } from "../../jobs/saveAdminActionsMetadata";
import { updateCountUnreadMessagesJob } from "../../jobs/updateCountUnreadMessages";
import { resetUnreadCountMessagesOfMemberJob } from "../../jobs/resetUnreadCountMessagesOfMember";
import { incrementUnreadCountMessageOfMembersJob } from "../../jobs/incrementUnreadCountMessageOfMembers";
import { StatisticController } from "../../controllers/controller.statistic";
import {
  TakeQuestDisputeComposHandler,
  DecideQuestDisputeComposHandler,
} from "../../handlers";
import {
  User,
  Admin,
  Quest,
  QuestChat,
  ChatMember,
  QuestDispute,
  MemberStatus,
  DisputeDecision,
  TransactionStatus,
  QuestDisputeReview,
  QuestDisputeDecisionData,
} from "@workquest/database-models/lib/models";

export async function getQuestDispute(r) {
  const chatDataLiteral = literal(
    `("QuestDispute"."assignedAdminId" = '${ r.auth.credentials.id }' )`
  )
  const dispute = await QuestDispute.findByPk(r.params.disputeId, {
    include: [{
      model: Quest,
      as: 'quest',
      include: [{
        model: QuestChat,
        as: 'questChat',
        attributes: {
          exclude: ['id', 'status', 'createdAt', 'updatedAt', 'disputeAdminId'],
          include: ['chatId'],
        },
        where: { chatDataLiteral },
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

export async function takeDisputeToResolve(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { disputeId } = r.params as { disputeId: string }

  const [dispute, chat, meAdminChatMember, [message, ]] = await new TakeQuestDisputeComposHandler(r.server.app.db)
    .Handle({
      meAdmin,
      disputeId,
    });

  //TODO: переделать
  const members = await ChatMember.findAll({
    attributes: ['id'],
    where: {
      chatId: chat.id,
      status: MemberStatus.Active,
    }
  });

  await saveAdminActionsMetadataJob({
    path: r.path,
    HTTPVerb: r.method,
    adminId: r.auth.credentials.id,
  });
  await resetUnreadCountMessagesOfMemberJob({
    chatId: chat.id,
    memberId: meAdminChatMember.id,
    lastReadMessage: { id: message.id, number: message.number },
  });
  await incrementUnreadCountMessageOfMembersJob({
    chatId: chat.id,
    skipMemberIds: [meAdminChatMember.id],
  });
  await updateChatDataJob({
    chatId: chat.id,
    lastMessageId: message.id,
  });
  await updateCountUnreadMessagesJob({
    lastUnreadMessage: { id: message.id, number: message.number },
    chatId: chat.id,
    readerMemberId: meAdminChatMember.id,
  });
  await setMessageAsReadJob({
    chatId: chat.id,
    senderMemberId: meAdminChatMember.id,
    lastUnreadMessage: { id: message.id, number: message.number }
  });
  await updateCountUnreadChatsJob({
    members,
  });
  await StatisticController.takeDisputeToResolveAction();

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.AdminTakeDispute,
    recipients: members.map(({ userId}) => userId),
    data: dispute,
  });

  return output(dispute);
}

export async function disputeDecide(r) {
  const meAdmin: Admin = r.auth.credentials;

  const { disputeId } = r.params as { disputeId: string };
  const { decision, decisionDescription } = r.payload as { decisionDescription: string, decision: DisputeDecision };

  const [chat, questDispute, [message]] = await new DecideQuestDisputeComposHandler(r.server.app.db)
    .Handle({
      meAdmin,
      decision,
      disputeId,
      decisionDescription,
    });

  // TODO !!
  await QuestDisputeDecisionData.create({
    decision: decision,
    disputeId: questDispute.id,
    status: TransactionStatus.Pending,
  });

  //TODO: переделать
  const members = await ChatMember.findAll({
    where: {
      chatId: chat.id,
      status: MemberStatus.Active,
    }
  });

  await r.server.app.taskScheduler.publisher({
    name: 'ResolveDisputeByAdmin',
    payload: {
      decision,
      disputeId: questDispute.id,
      questId: questDispute.questId,
    }
  });
  await saveAdminActionsMetadataJob({
    path: r.path,
    HTTPVerb: r.method,
    adminId: r.auth.credentials.id,
  });
  await incrementUnreadCountMessageOfMembersJob({
    chatId: chat.id,
    skipMemberIds: [],
  });
  await updateChatDataJob({
    chatId: chat.id,
    lastMessageId: message.id,
  });
  await updateCountUnreadChatsJob({ members });
  await StatisticController.disputeDecideAction();

  r.server.app.broker.sendQuestNotification({
    action: QuestNotificationActions.AdminTakeDispute,
    recipients: members.map(({ userId}) => userId),
    data: questDispute,
  });

  return output(questDispute);
}
