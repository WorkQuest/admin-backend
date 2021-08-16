import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {QuestsResponse, QuestDispute , DisputeStatus} from "@workquest/database-models/lib/models";
import { Op } from 'sequelize'

export async function getQuestDisputeInfo(r) {
  const dispute = await QuestDispute.findOne({
    where: {
      questId: r.params.questId,
    },
  });

  if(!dispute) {
    return error(Errors.NotFound, 'Dispute not found', {});
  }

  return output(dispute);
}

export async function getUserDisputeInfo(r) {
  const disputes = await QuestDispute.findAndCountAll({
    where: {
      userId: r.params.userId,
    },
    limit: r.query.limit,
    offset: r.query.offset,
  })

  if(!disputes) {
    return error(Errors.NotFound, "Disputes are not found", {});
  }

  return output({ count: disputes.count, disputes: disputes.rows });
}

export async function getActiveDisputesInfo(r) {
  const disputes = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: [ {status: DisputeStatus.pending}, {status: DisputeStatus.inProgress}]
    },
    limit: r.query.limit,
    offset: r.query.offset,
  })

  if(!disputes) {
    return error(Errors.NotFound, "Disputes are not found", {});
  }

  return output({ count: disputes.count, disputes: disputes.rows });
}

export async function takeDispute(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if(!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  dispute.mustHaveStatus(DisputeStatus.pending);

  await dispute.update({
    status: DisputeStatus.inProgress
  });
  return output(dispute);
}

export async function disputeDecision(r) {
  const dispute = await QuestDispute.findByPk(r.params.disputeId);

  if(!dispute) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }

  dispute.mustHaveStatus(DisputeStatus.inProgress)

  await dispute.update({
    decision: r.payload.decision,
    status: DisputeStatus.completed,
  });

  return output(dispute);
}

//TODO принять или отклонить диспут
export async function deleteDispute(r) {
  const dispute  = await QuestDispute.findByPk(r.params.disputeId);
  if (!dispute) {
    return error(Errors.NotFound, "Dispute not found", {});
  }

  if (dispute.status !== DisputeStatus.completed) {
    return error(Errors.InvalidStatus, "Dispute cannot be deleted at current stage", {});
  }

  await QuestsResponse.destroy({ where: { questId: dispute.id } })
  await dispute.destroy();

  return output();
}
