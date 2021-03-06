import * as Joi from 'joi';
import * as handlers from '../../api/v1/reports';
import { getRbacSettings } from "../../utils/auth";
import { AdminRole } from "@workquest/database-models/lib/models";
import {
  idSchema,
  searchSchema,
  reportSchema,
  emptyOkSchema,
  outputOkSchema,
  reportStatusSchema,
  reportEntityTypeSchema,
  outputPaginationSchema,
  reportWithEntitiesSchema, limitSchema, offsetSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: 'GET',
  path: '/v1/reports',
  handler: handlers.getReports,
  options: {
    id: 'v1.reports.getReports',
    tags: ['api', 'reports'],
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    description: 'Get all reports',
    validate: {
      query: Joi.object({
        q: searchSchema,
        adminId: idSchema,
        statuses: Joi.array().items(reportStatusSchema),
        entities: Joi.array().items(reportEntityTypeSchema),
        limit: limitSchema,
        offset: offsetSchema
      }).label('GetReportsQuery')
    },
    response: {
      schema: outputPaginationSchema('reports', reportSchema).label('GetReportsResponse'),
    }
  }
}, {
  method: 'GET',
  path: '/v1/reports/{reportId}',
  handler: handlers.getReport,
  options: {
    id: 'v1.reports.getReport',
    tags: ['api', 'reports'],
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    description: 'Get report by report id',
    validate: {
      params: Joi.object({
        reportId: idSchema.required(),
      }).label('GetReportParams'),
    },
    response: {
      schema: outputOkSchema(reportWithEntitiesSchema).label('GetReportResponse')
    }
  }
}, {
  method: 'POST',
  path: '/v1/reports/{reportId}/decide',
  handler: handlers.decideReport,
  options: {
    id: 'v1.report.decideReport',
    tags: ['api', 'reports'],
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    description: 'Decide report and block entity',
    validate: {
      params: Joi.object({
        reportId: idSchema.required(),
      }).label('DecideReportParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: 'POST',
  path: '/v1/reports/{reportId}/reject',
  handler: handlers.rejectReport,
  options: {
    id: 'v1.report.rejectReport',
    tags: ['api', 'reports'],
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    description: 'Reject report',
    validate: {
      params: Joi.object({
        reportId: idSchema.required(),
      }).label('RejectReportParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}]
