import * as Joi from "joi";
import {getRbacSettings} from "../../utils/auth";
import * as handlers from '../../api/v1/proposal';
import {AdminRole} from "@workquest/database-models/lib/models";
import {
  idSchema,
  proposalSchema,
  proposalQuerySchema,
  outputPaginationSchema,
} from '@workquest/database-models/lib/schemes';

export default [{
  method: 'GET',
  path: '/v1/proposals',
  handler: handlers.getProposals,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.getProposals',
    tags: ['api', 'proposal'],
    description: 'Get proposals',
    validate: {
      query: proposalQuerySchema.label('GetProposalsQuery'),
    },
    response: {
      schema: outputPaginationSchema('proposals', proposalSchema).label('GetProposalsResponse'),
    },
  },
}, {
  method: 'GET',
  path: '/v1/user/{userId}/proposals',
  handler: handlers.getProposals,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.getUserProposals',
    tags: ['api', 'proposal'],
    description: 'Get proposals by user',
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label('GetUserProposalsParams'),
      query: proposalQuerySchema.label('GetUserProposalsQuery'),
    },
    response: {
      schema: outputPaginationSchema('proposals', proposalSchema).label('GetUserProposalsResponse'),
    },
  },
}];
