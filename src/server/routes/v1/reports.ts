import * as Joi from 'joi';
import * as handlers from '../../api/v1/reports';
import { getRbacSettings } from "../../utils/auth";
import { AdminRole } from "@workquest/database-models/lib/models";
import {
  idSchema,
  searchSchema,
  reportEntityTypeSchema,
  reportStatusSchema
} from "@workquest/database-models/lib/schemes";

export default [{
  method: 'GET',
  path: '/v1/reports',
  handler: handlers.getReports,
  options: {
    id: 'v1.reports.getReports',
    tags: ['api', 'reports'],
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    description: 'Get all reports',
    validate: {
      query: Joi.object({
        statuses: Joi.array().items(reportStatusSchema),
        entities: Joi.array().items(reportEntityTypeSchema),
        adminId: idSchema,
        q: searchSchema,
      }).label('GetReportsQuery')
    }
  }
}, {
  method: 'GET',
  path: '/v1/reports/{reportId}',
  handler: handlers.getReport,
  options: {
    id: 'v1.reports.getReport',
    tags: ['api', 'reports'],
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    description: 'Get report by report id',
    validate: {
      params: Joi.object({
        reportId: idSchema.required(),
      }).label('GetReportParams'),
    },
  }
}]
