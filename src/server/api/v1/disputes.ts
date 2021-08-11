import {Dispute, DisputeStatus} from "@workquest/database-models/lib/models/Disputes";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {QuestsResponse} from "@workquest/database-models/lib/models";
import { Op } from 'sequelize'

export async function getDisputeInfo(r) {
  const dispute = await Dispute.findOne({
    where: {
      questId: r.params.questId,
    },
  });

  if(!dispute) {
    return error(Errors.NotFound, 'Dispute not found', {});
  }

  return output(dispute);
}

export async function getActiveDisputesInfo(r) {
  const disputes = await Dispute.findAndCountAll({
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
  const dispute = await Dispute.findByPk(r.params.disputeId);

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
  const dispute = await Dispute.findByPk(r.params.disputeId);

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

export async function deleteDispute(r) {
  const dispute  = await Dispute.findByPk(r.params.disputeId);
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
