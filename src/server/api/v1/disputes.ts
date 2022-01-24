import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {
  Admin,
  QuestsResponse,
  QuestDispute,
  DisputeStatus, Quest,
} from "@workquest/database-models/lib/models";
import { Op } from 'sequelize'

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

  await dispute.update({
    status: DisputeStatus.inProgress,
    assignedAdminId: r.auth.credentials.id,
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

  await Admin.increment('resolvedDisputes', {
    where: {id: r.auth.credentials.id}, transaction,
  });

  await transaction.commit();

  return output(await QuestDispute.findByPk(dispute.id));
}
