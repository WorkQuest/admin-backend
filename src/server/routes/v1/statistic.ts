import * as handlers from '../../api/v1/statistic';
import {
  proposalSchema,
  proposalQuerySchema,
  outputPaginationSchema,
} from '@workquest/database-models/lib/schemes';

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
        query: proposalQuerySchema.label('GetDaoStatisticQuery'),
      },
      response: {
        schema: outputPaginationSchema('proposals', proposalSchema).label('GetFiltersResponse'),
      },
    },
  },
];
