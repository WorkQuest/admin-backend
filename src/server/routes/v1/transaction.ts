import { AdminRole } from "@workquest/database-models/lib/models";
import * as handlers from "../../api/v1/transaction";
import { getRbacSettings } from "../../utils/auth";
import * as Joi from 'joi';
import {
  limitSchema,
  offsetSchema,
  outputPaginationSchema,
  transactionDisputeDataSchema,
  transactionSwapWqtDataSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: 'GET',
  path: '/v1/dispute/decide/transactions',
  handler: handlers.getDisputeDecisionTransactions,
  options: {
    id: 'v1.platformTransactions.dispute',
    description: 'Get dispute platform-transactions',
    plugins: getRbacSettings(AdminRole.Main),
    tags: ['api', 'platform-transactions'],
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema
      }).label('GetDisputeTransactionsQuery')
    },
    response: {
      schema: outputPaginationSchema('txs', transactionDisputeDataSchema)
        .label('GetDisputeTransactionsResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/swap-usdt/sended-users/transactions',
  handler: handlers.getSendFirstWqtTransactions,
  options: {
    id: 'v1.platformTransactions.swapUsdt',
    description: 'Get swap usdt platform-transactions',
    plugins: getRbacSettings(AdminRole.Main),
    tags: ['api', 'platform-transactions'],
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema
      }).label('GetSwapUsdtTransactionsQuery')
    },
    response: {
      schema: outputPaginationSchema('txs', transactionSwapWqtDataSchema)
        .label('GetSwapUsdtTransactionsResponse')
    }
  }
}];