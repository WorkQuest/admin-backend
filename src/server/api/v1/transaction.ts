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
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'desc']],
    include: [{
      model: Transaction,
      as: 'tx',
      required: false
    }, {
      model: QuestDispute,
      as: 'dispute',
      required: false
    }],
  });

  return output({ txs: rows, count });
}

export async function getSendFirstWqtTransactions(r) {
  const { rows, count } = await FirstWqtTransmissionData.findAndCountAll({
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'desc']],
    include: [{
      model: Transaction,
      as: 'tx',
      required: false
    }, {
      model: BridgeSwapUsdtTokenEvent,
      as: 'bridgeEvent',
      required: false
    }],
  });

  return output({ txs: rows, count });
}