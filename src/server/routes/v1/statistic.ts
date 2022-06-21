import * as Joi from "joi";
import { getRbacSettings } from "../../utils/auth";
import * as handlers from '../../api/v1/statistic';
import { AdminRole } from "@workquest/database-models/lib/models";
import {
  adminActionMetadataSchema,
  adminDisputeStatisticSchema,
  adminSupportStatisticSchema,
  adminQuestDisputesStatisticSchema,
  idSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  outputPaginationSchema,
  searchSchema,
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
}, {
  method: 'GET',
  path: '/v1/admin/{adminId}/statistic/dispute',
  handler: handlers.getDisputeAdminStatistics,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.admin.getDisputeStatistics',
    description: 'Get dispute admin statistics',
    tags: ['api', 'statistic'],
    validate: {
      params: Joi.object({
        adminId: idSchema.required()
      }).label('GetAdminDisputeStatisticsParams')
    },
    response: {
      schema: outputOkSchema(adminDisputeStatisticSchema).label('GetDisputeAdminStatisticResponse'),
    }
  }
}, {
  method: 'GET',
  path: '/v1/admin/{adminId}/statistic/support',
  handler: handlers.getSupportAdminStatistic,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.admin.getSupportStatistics',
    description: 'Get support admin statistics',
    tags: ['api', 'statistic'],
    validate: {
      params: Joi.object({
        adminId: idSchema.required()
      }).label('GetAdminSupportStatisticsParams')
    },
    response: {
      schema: outputOkSchema(adminSupportStatisticSchema).label('GetSupportAdminStatisticResponse'),
    }
  }
}];
