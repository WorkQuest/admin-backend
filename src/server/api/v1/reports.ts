import { ReportNotificationActions } from "../../controllers/controller.broker";
import { BindOrReplacements, literal, Op, WhereOptions } from 'sequelize';
import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import {
  DiscussionComment,
  reportEntities,
  ReportStatus,
  Report,
  Admin,
  Quest,
  User,
} from "@workquest/database-models/lib/models";

const searchReportFields = [
  'title',
  'description',
];

export async function getReports(r) {
  const userSearchLiteral = literal(
    `(SELECT "firstName" FROM "Users" WHERE "id" = "Report"."authorId") ILIKE :searchByFirstName ` +
    `OR (SELECT "lastName" FROM "Users" WHERE "id" = "Report"."authorId") ILIKE :searchByLastName`
  );

  const where: WhereOptions = {
    [Op.or]: [],
    ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
    ...(r.query.entities && { entityType: { [Op.in]: r.query.entities } }),
    ...(r.query.adminId && { resolvedByAdminId: r.query.adminId })
  };
  const replacements: BindOrReplacements = {};


  if (r.query.q) {
    where[Op.or].push(...searchReportFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    })));

    where[Op.or].push(userSearchLiteral);

    replacements.searchByFirstName = `%${r.query.q}%`;
    replacements.searchByLastName = `%${r.query.q}%`;
  }

  if (!where[Op.or].length) {
    delete where[Op.or];
  }

  const { rows, count } = await Report.findAndCountAll({
    attributes: { exclude: ['updatedAt'] },
    offset: r.query.offset,
    limit: r.query.limit,
    where,
    replacements,
    include: [{
      model: User.scope('short'),
      as: 'user',
    }, {
      model: Admin,
      as: 'admin',
      required: false
    }],
    order: [['number', 'DESC']]
  });

  return output({ reports: rows, count });
}

export async function getReport(r) {
  const report = await Report.findByPk(r.params.reportId, {
    attributes: {
      exclude: ['updatedAt'],
    },
    include: [{
      model: User.scope('short'),
      as: 'user',
    }, {
      model: Admin,
      as: 'admin'
    }, {
      model: User.scope('short'),
      as: 'entityUser',
    }, {
      model: Quest,
      as: 'entityQuest',
    }, {
      model: DiscussionComment,
      as: 'entityComment'
    }]
  });

  if (!report) {
    return error(Errors.NotFound, 'Report not found', {});
  }

  return output(report);
}

export async function rejectReport(r) {
  const report = await Report.findByPk(r.params.reportId);

  if (!report) {
    return error(Errors.NotFound, 'Report not found', {});
  }

  if (report.status !== ReportStatus.Created) {
    return error(Errors.InvalidStatus, 'Invalid report status', {});
  }

  await report.update({
    status: ReportStatus.Rejected,
    resolvedByAdminId: r.auth.credentials.id,
    resolvedAt: new Date()
  });

  await r.server.app.broker.sendReportNotification({
    recipients: [report.authorId],
    action: ReportNotificationActions.ReportRejected,
    data: { reportId: report.id }
  })

  return output();
}

export async function decideReport(r) {
  const report = await Report.findByPk(r.params.reportId);

  if (!report) {
    return error(Errors.NotFound, 'Report not found', {});
  }

  if (report.status !== ReportStatus.Created) {
    return error(Errors.InvalidStatus, 'Invalid report status', {});
  }

  const entityObject = reportEntities[report.entityType];

  if (!entityObject) {
    return error(Errors.NotFound, 'Entity not found', {});
  }

  const entityModel: any = entityObject.entity;

  const entity = await entityModel.findByPk(report.entityId);

  if (!entity) {
    return error(Errors.NotFound, 'Entity not found', {});
  }

  if (entity.status && entity.status === entityObject.statuses.Blocked) {
    await report.update({ status: ReportStatus.Decided });

    return error(Errors.InvalidStatus, 'Invalid entity status', {});
  }

  await r.server.app.db.transaction(async transaction => {
    await report.update({
        status: ReportStatus.Decided,
        resolvedByAdminId: r.auth.credentials.id,
        resolvedAt: new Date()
      }, { transaction }
    );

    await entity.update({
      status: entityObject.statuses.Blocked
    }, { transaction });
  });

  await r.server.app.broker.sendReportNotification({
    recipients: [report.authorId],
    action: ReportNotificationActions.ReportDecided,
    data: { reportId: report.id }
  })

  return output();
}
