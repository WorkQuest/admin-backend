import * as handlers from "../../api/v1/transaction";
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
  path: '/v1/transactions/dispute',
  handler: handlers.getDisputeDecisionTransactions,
  options: {
    id: 'v1.transactions.dispute',
    description: 'Get dispute transactions',
    tags: ['api', 'transactions'],
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
  path: '/v1/transactions/swap-usdt',
  handler: handlers.getSendFirstWqtTransactions,
  options: {
    id: 'v1.transactions.swap-usdt',
    description: 'Get swap usdt transactions',
    tags: ['api', 'transactions'],
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