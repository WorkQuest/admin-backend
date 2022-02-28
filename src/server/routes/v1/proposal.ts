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
    path: '/v1/proposal',
    handler: handlers.getDaoStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getProposals',
      tags: ['api', 'statistic'],
      description: 'Get proposals statistic',
      validate: {
        query: proposalQuerySchema.label('GetProposalsStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('proposals', proposalSchema).label('GetProposalsStatisticResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/{userId}/proposal',
    handler: handlers.getDaoStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getUserProposalsStatistic',
      tags: ['api', 'statistic'],
      description: 'Get proposals statistic for user',
      validate: {
        params: Joi.object({
          userId: idSchema.required(),
        }).label('GetUserProposalsStatisticParams'),
        query: proposalQuerySchema.label('GetUserProposalsStatisticForUserQuery'),
      },
      response: {
        schema: outputPaginationSchema('proposals', proposalSchema).label('GetUserProposalsStatisticForUserResponse'),
      },
    },
  },
];
