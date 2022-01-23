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

export async function getUserQuestDisputes(r) {
  const { count, rows } = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: {
        opponentUserId: r.auth.credentials.id,
        openDisputeUserId: r.auth.credentials.id,
      },
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}

export async function getQuestDisputes(r) {
  const where = {
    ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
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

  if (dispute.status !== DisputeStatus.inProgress) {
    throw error(Errors.InvalidStatus, 'Invalid status', {});
  }

  const transaction = await r.server.app.db.transaction();

  await dispute.update({
    decisionDescription: r.payload.decision,
    status: DisputeStatus.closed,
    resolvedAt: Date.now(),
  }, { transaction });

  await Quest.update({ status: dispute.openOnQuestStatus }, { where: { id: dispute.questId }, transaction});

  await Admin.increment('resolvedDisputes', {
    where: { id: r.auth.credentials.id }, transaction,
  });

  await transaction.commit();

  return output(await QuestDispute.findByPk(dispute.id));
}

export async function deleteDispute(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, "Dispute not found", {});
  }

  if (dispute.status !== DisputeStatus.closed) {
    return error(Errors.InvalidStatus, "Dispute cannot be deleted at current stage", {});
  }

  await dispute.destroy();

  return output();
}

export async function getAdminDisputes(r) {
  const { count, rows } = await QuestDispute.findAndCountAll({
    where: { assignedAdminId: r.params.adminId },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}
