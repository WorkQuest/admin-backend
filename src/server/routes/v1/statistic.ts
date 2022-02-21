import * as Joi from "joi";
import * as handlers from '../../api/v1/statistic';
import {
  proposalSchema,
  proposalQuerySchema,
  outputPaginationSchema,
  limitSchema,
  offsetSchema, searchSchema, adminActionSchema, userSessionSchema,
} from '@workquest/database-models/lib/schemes';
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";
import {getUsersSessionStatistic, getUserStatistic} from "../../api/v1/statistic";

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
    path: '/v1/user/statistic/sessions',
    handler: handlers.getUsersSessionStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getUserSessionsStatistic',
      tags: ['api', 'statistic'],
      description: 'Get users sessions statistic',
      validate: {
        query: Joi.object({
          q: searchSchema,
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetUserSessionsStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('actions', userSessionSchema).label('GetUserSessionsStatisticResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/user/{userId}/statistic',
    handler: handlers.getUserStatistic,
    options: {
      auth: 'jwt-access',
      plugins: getRbacSettings(AdminRole.main),
      id: 'v1.getUserStatistic',
      tags: ['api', 'statistic'],
      description: 'Get user statistic',
      validate: {
        query: Joi.object({
          q: searchSchema,
          limit: limitSchema,
          offset: offsetSchema,
        }).label('GetUserStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('actions', userSessionSchema).label('GetUserStatisticResponse'),
      },
    },
  },
];
