import {output} from "../../utils";
import {literal, Op} from "sequelize";
import {
  User,
  Admin,
  Proposal,
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

export async function getAdminActionStatistic(r) {
  const searchByFirstAndLastNameLiteral = literal(
    `1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Admins" as "admin" ` +
    `WHERE ("admin"."firstName" || ' ' || "admin"."lastName" ILIKE :query OR "admin"."role" ILIKE :query) AND "AdminAction"."adminId" = "admin"."id") THEN 1 ELSE 0 END ) `,
  );
  const replacements = {};

  const where = {
    ...(r.params.adminId && { adminId: r.params.adminId }),
  };

  const include = [{
    model: Admin,
    as: 'admin'
  }];

  if (r.query.q) {
    where[Op.or] = searchByFirstAndLastNameLiteral;
    replacements['query'] = `%${r.query.q}%`;
  }

  const {count, rows} = await AdminActionMetadata.findAndCountAll({
    where,
    include,
    replacements,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'desc']]
  });

  return output({count, actions: rows});
}

export async function getQuestDisputesStatistic(r) {
  const searchByFirstAndLastNameLiteral = literal(
    `(1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Admins" as "admin" ` +
    `WHERE "admin"."firstName" || ' ' || "admin"."lastName" ILIKE :query AND "AdminQuestDisputesStatistic"."adminId" = "admin"."id") THEN 1 ELSE 0 END )) `
  );

  const replacements = {};

  const where = {
    ...(r.params.adminId && { adminId: r.params.adminId }),
  };

  const include = [{
    model: Admin,
    as: 'admin'
  }];

  if (r.query.q) {
    where[Op.or] = searchByFirstAndLastNameLiteral;
    replacements['query'] = `%${r.query.q}%`;
  }

  const {count, rows} = await AdminQuestDisputesStatistic.findAndCountAll({
    where,
    include,
    replacements,
  });

  return output({count, disputesStatistic: rows});
}

export async function getQuestDisputesAdminStatistic(r) {
  const include = [{
    model: Admin,
    as: 'admin'
  }];

  const adminStatistic = await AdminQuestDisputesStatistic.findOne({
    where: { adminId: r.params.adminId },
    include,
  });

  return output(adminStatistic);
}

