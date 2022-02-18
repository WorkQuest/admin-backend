import {AdminActionMethod, Proposal, User} from "@workquest/database-models/lib/models";
import {output} from "../../utils";
import {literal, Op} from "sequelize";
import saveAdminActions from "../../jobs/saveAdminActions";

export const searchProposalFields = [
  'title',
  'description',
];

export async function getDaoStatistic(r) {
  const searchByFirstAndLastNameLiteral = literal(
    `1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Users" as "author" ` +
    `WHERE "author"."firstName" || ' ' || "author"."lastName" ILIKE :query AND "Proposal"."userId" = "author"."id") THEN 1 ELSE 0 END ) `,
  );
  const replacements = {};

  const where = {
    ...(r.query.statuses && {status: {[Op.in]: r.query.statuses}})
  }

  const order = [];

  const include = [{
    model: User.scope('shortWithWallet'),
    as: 'author'
  }];

  if (r.query.q) {
    where[Op.or] = searchProposalFields.map(field => ({
      [field]: {[Op.iLike]: `%${r.query.q}%`}
    }));
    where[Op.or].push(searchByFirstAndLastNameLiteral);
    replacements['query'] = `%${r.query.q}%`;
  }

  for (const [key, value] of Object.entries(r.query.sort || {})) {
    order.push([key, value]);
  }

  const {count, rows} = await Proposal.findAndCountAll({
    where,
    include,
    order,
    replacements,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({count, proposals: rows});
}

export async function getAdminActionStatistic(r) {


  await Proposal.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'desc']]
  });

}
