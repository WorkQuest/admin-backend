import { BindOrReplacements, literal, Op, WhereOptions } from 'sequelize';
import { Admin, DiscussionComment, Quest, Report, ReportStatus, User } from "@workquest/database-models/lib/models";
import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";

const searchReportFields = [
  'title',
  'description'
]

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
    replacements,
    where,
    include: [{
      model: User.scope('short'),
      as: 'user',
    }, {
      model: Admin,
      as: 'admin',
      required: false
    }]
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
      model: Quest.scope('short'),
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

export async function closeReport(r) {
  const report = await Report.findByPk(r.params.reportId);

  if (!report) {
    return error(Errors.NotFound, 'Report not found', {});
  }

  if (report.status !== ReportStatus.Created) {
    return error(Errors.InvalidStatus, 'Invalid report status', {});
  }

  await report.update({
    status: ReportStatus.Rejected
  });

  // TODO: отправить нотификации

  return output();
}

export async function blockEntity(r) {
  const report = await Report.findByPk(r.params.reportId);

  if (!report) {
    return error(Errors.NotFound, 'Report not found', {});
  }

  if (report.status !== ReportStatus.Created) {
    return error(Errors.InvalidStatus, 'Invalid report status', {});
  }

  
}
