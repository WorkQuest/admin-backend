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
    path: '/v1/user/statistic/dao/proposal',
    handler: handlers.getDaoStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getDaoStatistic',
      tags: ['api', 'statistic'],
      description: 'Get dao proposals statistic',
      validate: {
        query: proposalQuerySchema.label('GetDaoProposalsStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('proposals', proposalSchema).label('GetDaoProposalsStatisticResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/statistic/{userId}/dao/proposal',
    handler: handlers.getDaoStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getUserDaoProposalsStatistic',
      tags: ['api', 'statistic'],
      description: 'Get dao proposals statistic for user',
      validate: {
        params: Joi.object({
          userId: idSchema.required(),
        }).label('GetUserDaoProposalsStatisticParams'),
        query: proposalQuerySchema.label('GetUserDaoProposalsStatisticForUserQuery'),
      },
      response: {
        schema: outputPaginationSchema('proposals', proposalSchema).label('GetUserDaoProposalsStatisticForUserResponse'),
      },
    },
  },
];
