import {Op} from 'sequelize'
import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import {QuestNotificationActions} from "../../controllers/controller.broker";
import {saveAdminActionsMetadataJob} from "../../jobs/saveAdminActionsMetadata";
import {incrementAdminDisputeStatisticJob} from "../../jobs/incrementAdminDisputeStatistic";
import {
  User,
  Admin,
  Quest,
  QuestDispute,
  DisputeStatus,
  QuestDisputeReview,
} from "@workquest/database-models/lib/models";

export async function getQuestDispute(r) {
  return error(Errors.Forbidden, 'Not implemented', {});
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute not found', {});
  }

  return output(dispute);
}

export async function getQuestDisputes(r) {
  return error(Errors.Forbidden, 'Not implemented', {});
  const where = {
    ...(r.params.adminId && { assignedAdminId: r.params.adminId }),
    ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
    ...(r.params.userId && { [Op.or]: { opponentUserId: r.params.userId, openDisputeUserId: r.params.userId } }),
    ...(r.params.questId && { questId: r.params.questId }),
  }

  const { count, rows } = await QuestDispute.findAndCountAll({
    where,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}

export async function takeDisputeToResolve(r) {
  return error(Errors.Forbidden, 'Not implemented', {});
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }
  if (dispute.status !== DisputeStatus.pending) {
    throw error(Errors.InvalidStatus, 'Invalid status', {});
  }

  await dispute.update({
    status: DisputeStatus.inProgress,
    acceptedAt: Date.now(),
    assignedAdminId: r.auth.credentials.id,
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output(dispute);
}

export async function disputeDecide(r) {
  return error(Errors.Forbidden, 'Not implemented', {});
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

  await dispute.update({
    resolvedAt: Date.now(),
    status: DisputeStatus.closed,
    decisionDescription: r.payload.decisionDescription,
  }, {transaction});

  await Quest.update({status: dispute.openOnQuestStatus}, {where: {id: dispute.questId}, transaction});

  await transaction.commit();

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
  return error(Errors.Forbidden, 'Not implemented', {});
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
  return error(Errors.Forbidden, 'Not implemented', {});
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
