import * as handlers from '../../api/v1/platformStatistics';
import * as Joi from 'joi';
import {
  DaoPlatformStatistic,
  UsersPlatformStatistic,
  QuestsPlatformStatistic,
  ReportsPlatformStatistic,
  DisputesPlatformStatistic,
  RaiseViewsPlatformStatistic
} from "@workquest/database-models/lib/models";
import { isoDateSchema } from "@workquest/database-models/lib/schemes";

export default [
  {
    method: 'GET',
    path: '/v1/platform-statistics/allowed-dates',
    handler: handlers.getAllowedDates,
    options: {
      id: 'v1.platform-statistics.getAllowedDates',
      tags: ['api', 'platform-statistics'],
      description: 'Get allowed dates for platform statistics',
      validate: {
        query: Joi.object({
          statistic: Joi.string().valid(...[
            DaoPlatformStatistic.name,
            UsersPlatformStatistic.name,
            QuestsPlatformStatistic.name,
            ReportsPlatformStatistic.name,
            DisputesPlatformStatistic.name,
            RaiseViewsPlatformStatistic.name,
          ]).required(),
        }),
      }
    }
  },
  {
    method: 'GET',
    path: '/v1/platform-statistics/users',
    handler: handlers.getUsersPlatformStatistic,
    options: {
      id: 'v1.platform-statistics.getUsersStatistic',
      tags: ['api', 'platform-statistics'],
      description: 'Get users platform statistic',
      validate: {
        query: Joi.object({
          dateFrom: isoDateSchema,
          dateTo: isoDateSchema.default(new Date())
        }).label('GetUsersPlatformStatisticQuery')
      }
    }
  }
]