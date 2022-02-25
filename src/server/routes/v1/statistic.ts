import * as Joi from "joi";
import * as handlers from '../../api/v1/statistic';
import {
  proposalSchema,
  proposalQuerySchema,
  outputPaginationSchema,
  limitSchema,
  offsetSchema, searchSchema, adminActionSchema, adminQuestDisputesStatisticSchema, idSchema,
} from '@workquest/database-models/lib/schemes';
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";
import {getQuestDisputesStatistic} from "../../api/v1/statistic";

export default [
  {
    method: 'GET',
    path: '/v1/statistic/dao',
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
    path: '/v1/admin/statistic/action',
    handler: handlers.getAdminActionStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getAdminActionStatistic',
      tags: ['api', 'statistic'],
      description: 'Get admins actions statistic',
      validate: {
        query: Joi.object({
          q: searchSchema,
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetAdminActionsStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('actions', adminActionSchema).label('GetAdminActionsStatisticResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/admin/statistic/disputes',
    handler: handlers.getQuestDisputesStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getQuestDisputesStatistic',
      tags: ['api', 'statistic'],
      description: 'Get questDisputes statistic',
      validate: {
        query: Joi.object({
          q: searchSchema,
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetQuestDisputesStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('questDisputesStatistic', adminQuestDisputesStatisticSchema).label('ПetQuestDisputesStatisticResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/admin/statistic/{adminId}/disputes',
    handler: handlers.getQuestDisputesStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getQuestDisputesAdminStatistic',
      tags: ['api', 'statistic'],
      description: 'Get questDisputes admin statistic',
      validate: {
        params: Joi.object({
          adminId: idSchema.required(),
        }).label('GetQuestDisputesAdminStatistic'),
      },
      response: {
        schema: outputPaginationSchema('questDisputesAdminStatistic', adminQuestDisputesStatisticSchema).label('ПetQuestDisputesStatisticResponse'),
      },
    },
  },
];
