import {Proposal} from "@workquest/database-models/lib/models";
import {output} from "../../utils";
import {Op} from "sequelize";

export async function getDaoStatistic(r) {
  const {count, rows} = await Proposal.findAndCountAll({
    where: { status: {[Op.in]: r.query.status} },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({count, statistic: rows});
}
