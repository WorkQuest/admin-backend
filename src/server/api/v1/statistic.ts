import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import { literal, Op } from "sequelize";
import {
  Admin,
  Report,
  AdminRole,
  TicketStatus,
  QuestDispute,
  ReportStatus,
  DisputeStatus,
  ReportEntityType,
  AdminActionMetadata,
  SupportTicketForUser,
  AdminQuestDisputesStatistic,
} from "@workquest/database-models/lib/models";

export const searchProposalFields = [
  'title',
  'description',
];

export const searchAdminFields = [
  'firstName',
  'lastName',
  'role',
];

export async function getAdminActions(r) {
  const searchByFirstAndLastNameLiteral = literal(
    `1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Admins" as "admin" ` +
    `WHERE ("admin"."firstName" || ' ' || "admin"."lastName" ILIKE :query OR "admin"."role" ILIKE :query) AND "AdminAction"."adminId" = "admin"."id") THEN 1 ELSE 0 END ) `,
  );

  const replacements = {};

  const where = {
    ...(r.params.adminId && { adminId: r.params.adminId }),
  };

  if (r.query.q) {
    where[Op.or] = searchByFirstAndLastNameLiteral;
    replacements['query'] = `%${r.query.q}%`;
  }

  const { count, rows } = await AdminActionMetadata.findAndCountAll({
    where,
    replacements,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'desc']],
    include: { model: Admin, as: 'admin', required: true },
  });

  return output({ count, actions: rows });
}

export async function getQuestDisputesStatistics(r) {
  const searchByFirstAndLastNameLiteral = literal(
    `(1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Admins" as "admin" ` +
    `WHERE "admin"."firstName" || ' ' || "admin"."lastName" ILIKE :query AND "AdminQuestDisputesStatistic"."adminId" = "admin"."id") THEN 1 ELSE 0 END )) `
  );

  const replacements = {};

  const where = {
    ...(r.params.adminId && { adminId: r.params.adminId }),
  };

  if (r.query.q) {
    where[Op.or] = searchByFirstAndLastNameLiteral;
    replacements['query'] = `%${r.query.q}%`;
  }

  const { count, rows } = await AdminQuestDisputesStatistic.findAndCountAll({
    where,
    replacements,
    include: { model: Admin, as: 'admin', required: true }
  });

  return output({ count, statistics: rows });
}

export async function getQuestDisputesAdminMeStatistic(r) {
  const adminQuestDisputesStatistic = await AdminQuestDisputesStatistic.findOne({
    include: { model: Admin, as: 'admin' },
    where: { adminId: r.auth.credentials.id },
  });

  return output(adminQuestDisputesStatistic);
}

export async function getDisputeAdminStatistics(r) {
  const disputeAdmin = await Admin.findByPk(r.params.adminId);

  if (!disputeAdmin) {
    return error(Errors.NotFound, 'Admin not found', {});
  }

  if (disputeAdmin.role !== AdminRole.Dispute) {
    return error(Errors.InvalidPayload, 'Admin does not has Dispute Admin role', {});
  }

  const disputeDecideStatisticByDecision: any = await QuestDispute.unscoped().count({
    attributes: [[literal('SUM(COUNT(status)) OVER()'), 'total']],
    where: {
      assignedAdminId: r.params.adminId,
      status: { [Op.in]: [DisputeStatus.Closed] },
      decision: { [Op.not]: null }
    },
    group: ['decision']
  });

  const disputeDecideStatistic = { AcceptWork: 0, RejectWork: 0, Rework: 0 };

  disputeDecideStatisticByDecision.map(({ decision, count, total }) => {
    disputeDecideStatistic[decision] = (parseInt(count) / parseInt(total)) * 100;
  });

  const reportStatisticByStatus: any = await Report.unscoped().count({
    where: {
      resolvedByAdminId: r.params.adminId,
      entityType: { [Op.ne]: ReportEntityType.DiscussionComment },
      status: { [Op.ne]: ReportStatus.Created }
    },
    group: ['status', 'entityType']
  });

  const reportStatistic = {
    User: { Decided: 0, Rejected: 0 },
    Quest: { Decided: 0, Rejected: 0 }
  }

  const totalCountByEntityType = { User: 0, Quest: 0 };
  reportStatisticByStatus.map(({ entityType, count }) => totalCountByEntityType[entityType] += parseInt(count));

  reportStatisticByStatus.map(({ status, entityType, count }) => {
    reportStatistic[entityType][ReportStatus[status]] =
      (parseInt(count) / parseInt(totalCountByEntityType[entityType])) * 100;
  });

  const adminQuestDisputesStatistic = await AdminQuestDisputesStatistic.findOne({
    where: { adminId: r.params.adminId },
    include: { model: Admin, as: 'admin'}
  });

  return output({ disputeDecideStatistic, reportStatistic, disputeStatistic: adminQuestDisputesStatistic });
}

export async function getSupportAdminStatistic(r) {
  const supportAdmin = await Admin.findByPk(r.params.adminId);

  if (!supportAdmin) {
    return error(Errors.NotFound, 'Admin not found', {});
  }

  if (supportAdmin.role !== AdminRole.Support) {
    return error(Errors.InvalidPayload, 'Admin does not has Support Admin role', {});
  }

  const supportStatisticByStatus: any = await SupportTicketForUser.count({
    where: { resolvedByAdminId: r.params.adminId },
    group: ['status']
  });

  const supportStatistic = { Decided: 0, Rejected: 0, Pending: 0 };

  supportStatisticByStatus.map(({ status, count, }) => {
    supportStatistic[TicketStatus[status]] = parseInt(count);
  });

  return output(supportStatistic);
}
