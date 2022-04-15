import {output} from "../../utils";
import {literal, Op} from "sequelize";
import {
  Admin,
  AdminActionMetadata,
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

export async function getQuestDisputesAdminStatistic(r) {
  const adminQuestDisputesStatistic = await AdminQuestDisputesStatistic.findOne({
    where: { adminId: r.params.adminId },
    include: { model: Admin, as: 'admin' }
  });

  return output(adminQuestDisputesStatistic);
}

export async function getQuestDisputesAdminMeStatistic(r) {
  const adminQuestDisputesStatistic = await AdminQuestDisputesStatistic.findOne({
    include: { model: Admin, as: 'admin' },
    where: { adminId: r.auth.credentials.id },
  });

  return output(adminQuestDisputesStatistic);
}

