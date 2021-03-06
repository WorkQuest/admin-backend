import {output} from "../../utils";
import {literal, Op} from "sequelize";
import {searchProposalFields} from "./statistic";
import { Proposal, ProposalCreatedEvent, ProposalVoteCastEvent, User } from "@workquest/database-models/lib/models";

export async function getProposals(r) {
  const searchByFirstAndLastNameLiteral = literal(
    `1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Users" as "author" ` +
    `WHERE "author"."firstName" || ' ' || "author"."lastName" ILIKE :query AND "Proposal"."userId" = "author"."id") THEN 1 ELSE 0 END ) `,
  );

  const searchByProposalTitleLiteral = literal(`"Proposal"."title" ILIKE :query`);

  const replacements = {};

  const where = {
    ...(r.query.statuses && {status: { [Op.in]: r.query.statuses } }),
    ...(r.params.userId && { proposerUserId: r.params.userId }),
  }

  const order = [];

  const include = [{
    model: User.scope('shortWithWallet'),
    as: 'proposerUser'
  }, {
    model: ProposalCreatedEvent,
    as: 'createdEvent',
    attributes: ["votingPeriod"],
  }, {
    model: ProposalVoteCastEvent,
    as: 'voteCastEvents',
    attributes: ["voter", "support", "votes"]
  }];

  if (r.query.q) {
    where[Op.or] = searchProposalFields.map(field => ({
      [field]: {[Op.iLike]: `%${r.query.q}%`}
    }));
    where[Op.or].push(searchByFirstAndLastNameLiteral);
    where[Op.or].push(searchByProposalTitleLiteral);
    replacements['query'] = `%${r.query.q}%`;
  }


  for (const [key, value] of Object.entries(r.query.sort || {})) {
    order.push([key, value]);
  }

  const {count, rows} = await Proposal.findAndCountAll({
    distinct: true,
    where,
    include,
    order,
    replacements,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({count, proposals: rows});
}
