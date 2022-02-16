import * as Joi from 'joi';
import * as handlers from '../../api/v1/statistic';
import {
  adminEmailSchema,
  adminFirstNameSchema,
  adminLastNameSchema, adminPasswordSchema, adminRoleSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema
} from '@workquest/database-models/lib/schemes';
import {ProposalStatus} from "@workquest/database-models/lib/models";

export default [
  {
    method: 'GET',
    path: '/v1/statistic/dao',
    handler: handlers.getDaoStatistic,
    options: {
      auth: 'jwt-access',
      id: 'v1.getDaoStatistic',
      tags: ['api', 'statistic'],
      description: 'Get dao statistic',
      validate: {
        query: Joi.object({
          status: Joi.array().items(Joi.number().valid(...Object.keys(ProposalStatus).map(key => parseInt(key)).filter(key => !isNaN(key))).example(ProposalStatus.Active)),
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetDaoStatisticQuery'),
      },
      response: {
        schema: outputOkSchema(Joi.object().example({ IT: { id: 1, skills: { it: 100 } } })).label('GetFiltersResponse'),
      },
    },
  },
];
