import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {
  Admin,
  QuestsResponse,
  QuestDispute ,
  DisputeStatus,
} from "@workquest/database-models/lib/models";
import { Op } from 'sequelize'

export async function getQuestDispute(r) {
  const dispute = await QuestDispute.findOne({
    where: {
      questId: r.params.questId,
    },
  });

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute not found', {});
  }

  return output(dispute);
}

export async function getUserDisputes(r) {
  const { count, rows } = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: {
        openDisputeUserId: r.auth.credentials.id,
        opponentUserId: r.auth.credentials.id,
      },
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}

// statuses: inProgress && Created
export async function getActiveDisputes(r) {
  const { count, rows } = await QuestDispute.findAndCountAll({
    where: { status: { [Op.or]: [DisputeStatus.pending, DisputeStatus.inProgress] } },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}

export function getDisputesByStatus(status: DisputeStatus) {
  return async function(r){
    const { count, rows } = await QuestDispute.findAndCountAll({
      where: { status },
      limit: r.query.limit,
      offset: r.query.offset,
    });

    return output({ count: count, disputes: rows });
  }
}

export async function takeDisputeToResolve(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  dispute.mustHaveStatus(DisputeStatus.pending);

  await dispute.update({ status: DisputeStatus.inProgress });

  return output(dispute);
}

export async function disputeDecision(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId);
  const transaction = await r.server.app.db.transaction();

  if (!dispute) {
    await transaction.rollback();
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  dispute.mustHaveStatus(DisputeStatus.inProgress);

  await dispute.update({
    decision: r.payload.decision,
    status: DisputeStatus.completed,
    resolvedByAdminId: r.auth.credentials.id,
    resolveAt: Date.now(),
  }, { transaction });

  await Admin.increment('resolvedDisputes', {
    where: { id: r.auth.credentials.id },
    transaction
  });

  await transaction.commit();
  return output(dispute);
}

// TODO принять или отклонить диспут
export async function deleteDispute(r) {
  const dispute  = await QuestDispute.findByPk(r.params.disputeId);

  if (!dispute) {
    return error(Errors.NotFound, "Dispute not found", {});
  }

  if (dispute.status !== DisputeStatus.completed) {
    return error(Errors.InvalidStatus, "Dispute cannot be deleted at current stage", {});
  }

  await QuestsResponse.destroy({ where: { questId: dispute.questId } });
  await dispute.destroy();

  return output();
}

export async function getAdminDisputes(r){
  const { count, rows } = await QuestDispute.findAndCountAll({
    where: {
      resolvedByAdminId: r.params.adminId
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}

export async function adminResolvedDisputes(r){
  const { count, rows } = await QuestDispute.findAndCountAll({
    where: {
      status: DisputeStatus.completed,
      resolvedByAdminId: r.auth.credentials.id,
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, disputes: rows });
}
