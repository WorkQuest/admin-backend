import {
  BridgeSwapUsdtTokenEvent,
  FirstWqtTransmissionData,
  QuestDispute,
  QuestDisputeDecisionData,
  Transaction
} from "@workquest/database-models/lib/models";
import { output } from "../../utils";

export async function getDisputeDecisionTransactions(r) {
  const { rows, count } = await QuestDisputeDecisionData.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'desc']],
    include: [{
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      model: Transaction,
      as: 'tx',
    }, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      model: QuestDispute,
      as: 'dispute'
    }],
  });

  return output({ txs: rows, count });
}

export async function getSendFirstWqtTransactions(r) {
  const { rows, count } = await FirstWqtTransmissionData.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'desc']],
    include: [{
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      model: Transaction,
      as: 'tx',
    }, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      model: BridgeSwapUsdtTokenEvent,
      as: 'bridgeEvent'
    }],
  });

  return output({ txs: rows, count });
}