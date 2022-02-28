import * as Joi from "joi";
import * as handlers from '../../api/v1/proposal';
import {
  proposalSchema,
  proposalQuerySchema,
  outputPaginationSchema,
  idSchema,
} from '@workquest/database-models/lib/schemes';
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";

export default [
  {
    method: 'GET',
    path: '/v1/user/statistic/dao',
    handler: handlers.getDaoStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getDaoStatistic',
      tags: ['api', 'statistic'],
      description: 'Get dao statistic',
      validate: {
        query: proposalQuerySchema.label('GetDaoStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('proposals', proposalSchema).label('GetDaoStatisticResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/statistic/{userId}/dao',
    handler: handlers.getDaoStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getUserDaoStatistic',
      tags: ['api', 'statistic'],
      description: 'Get dao statistic for user',
      validate: {
        params: Joi.object({
          userId: idSchema.required(),
        }).label('GetUserDaoStatisticParams'),
        query: proposalQuerySchema.label('GetUserDaoStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('proposals', proposalSchema).label('GetUserDaoStatisticResponse'),
      },
    },
  },
];
