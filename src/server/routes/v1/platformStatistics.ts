import { isoDateSchema, platformStatisticsSchema } from "@workquest/database-models/lib/schemes";
import { AdminRole } from "@workquest/database-models/lib/models";
import * as handlers from '../../api/v1/platformStatistics';
import { getRbacSettings } from "../../utils/auth";
import * as Joi from 'joi';

export default [
  {
    method: 'GET',
    path: '/v1/platform-statistics/{statistic}/dates',
    handler: handlers.getAllowedDates,
    options: {
      auth: 'jwt-access',
      id: 'v1.platform-statistics.getAllowedDates',
      plugins: getRbacSettings(AdminRole.Main, AdminRole.Advertising),
      tags: ['api', 'platform-statistics'],
      description: 'Get allowed dates for platform statistics',
      validate: {
        params: Joi.object({
          statistic: platformStatisticsSchema.required()
        }).label('GetPlatformStatisticsAllowedDatesParams'),
      }
    }
  },
  {
    method: 'GET',
    path: '/v1/platform-statistics/{statistic}',
    handler: handlers.getPlatformStatistic,
    options: {
      auth: 'jwt-access',
      id: 'v1.platform-statistics.getUsersStatistic',
      plugins: getRbacSettings(AdminRole.Main, AdminRole.Advertising),
      tags: ['api', 'platform-statistics'],
      description: 'Get users platform statistic',
      validate: {
        params: Joi.object({
          statistic: platformStatisticsSchema.required()
        }).label('GetPlatformStatisticParams'),
        query: Joi.object({
          dateFrom: isoDateSchema,
          dateTo: isoDateSchema.default(new Date())
        }).label('GetPlatformStatisticQuery')
      }
    }
  }
]