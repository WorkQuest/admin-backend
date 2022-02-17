import {Proposal} from "@workquest/database-models/lib/models";
import {output} from "../../utils";
import {Op} from "sequelize";

export async function getDaoStatistic(r) {
  const where = {
    ...(r.query.statuses&& {status: {[Op.in]: r.query.statuses}})
  }
  const {count, rows} = await Proposal.findAndCountAll({
    where,
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({count, proposals: rows});
}

