import * as Joi from "joi";
import {getRbacSettings} from "../../utils/auth";
import * as handlers from '../../api/v1/statistic';
import {AdminRole} from "@workquest/database-models/lib/models";
import {
  idSchema,
  limitSchema,
  offsetSchema,
  searchSchema,
  outputOkSchema,
  outputPaginationSchema,
  adminActionMetadataSchema,
  adminQuestDisputesStatisticSchema,
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'GET',
  path: '/v1/admin/statistic/actions',
  handler: handlers.getAdminActions,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.admin.statistic.getAdminsActions',
    tags: ['api', 'statistic'],
    description: 'Get admins actions statistic',
    validate: {
      query: Joi.object({
        q: searchSchema,
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAdminsActionsQuery'),
    },
    response: {
      schema: outputPaginationSchema('actions', adminActionMetadataSchema).label('GetAdminsActionsResponse'),
    },
  },
}, {
  method: 'GET',
  path: '/v1/admin/{adminId}/statistic/actions',
  handler: handlers.getAdminActions,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.admin.statistic.getAdminActions',
    tags: ['api', 'statistic'],
    description: 'Get admin actions statistic',
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label('GetAdminActionsParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAdminActionsQuery'),
    },
    response: {
      schema: outputPaginationSchema('actions', adminActionMetadataSchema).label('GetAdminActionsResponse'),
    },
  },
}, {
  method: 'GET',
  path: '/v1/admin/statistic/quest/dispute-statistics',
  handler: handlers.getQuestDisputesStatistics,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.admin.statistic.quest.getQuestDisputeStatistics',
    tags: ['api', 'statistic'],
    description: 'Get quest dispute statistics',
    validate: {
      query: Joi.object({
        q: searchSchema,
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAdminsQuestDisputeStatisticsQuery'),
    },
    response: {
      schema: outputPaginationSchema('statistics', adminQuestDisputesStatisticSchema).label('GetAdminsQuestDisputeStatisticsResponse'),
    },
  },
}, {
  method: 'GET',
  path: '/v1/admin/{adminId}/statistic/quest/dispute-statistic',
  handler: handlers.getQuestDisputesAdminStatistic,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.admin.statistic.quest.getQuestDisputesAdminStatistic',
    tags: ['api', 'statistic'],
    description: 'Get quest dispute admin statistic',
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label('GetQuestDisputeAdminStatisticParams'),
    },
    response: {
      schema: outputOkSchema(adminQuestDisputesStatisticSchema).label('GetQuestDisputeAdminStatisticResponse'),
    },
  },
}, {
  method: 'GET',
  path: '/v1/admin/me/statistic/quest/dispute-statistic',
  handler: handlers.getQuestDisputesAdminMeStatistic,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    id: 'v1.admin.statistic.quest.getQuestDisputesAdminMeStatistic',
    tags: ['api', 'statistic'],
    description: 'Get questDisputes admin (me) statistic',
    response: {
      schema: outputOkSchema(adminQuestDisputesStatisticSchema).label('GetQuestDisputesStatisticMeResponse'),
    },
  },
}];
