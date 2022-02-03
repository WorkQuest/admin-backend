import * as Joi from 'joi';
import * as handlers from '../../api/v1/skillFilters';
import { outputOkSchema } from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'GET',
    path: '/v1/skill-filters',
    handler: handlers.getFilters,
    options: {
      id: 'v1.getSkillFilters',
      tags: ['api', 'skill-filters'],
      description: 'Get all filters',
      auth: 'jwt-access',
      response: {
        schema: outputOkSchema(Joi.object().example({ IT: { id: 1, skills: { it: 100 } } })).label('GetFiltersResponse'),
      },
    },
  },
];
