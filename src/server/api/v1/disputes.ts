import { literal, Op } from 'sequelize'
import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import { saveAdminActionsMetadataJob } from "../../jobs/saveAdminActionsMetadata";
import {
  User,
  Admin,
  Quest,
  QuestChat,
  QuestDispute,
  DisputeStatus,
  QuestDisputeReview,
} from "@workquest/database-models/lib/models";

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
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }
  if (dispute.status !== DisputeStatus.Created) {
    throw error(Errors.InvalidStatus, 'Invalid status', {});
  }

  await dispute.update({
    status: DisputeStatus.InProgress,
    acceptedAt: Date.now(),
    assignedAdminId: r.auth.credentials.id,
  });

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

  await dispute.update({
    decisionDescription: r.payload.decisionDescription,
  });

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
