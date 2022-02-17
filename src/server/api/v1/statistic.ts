import {AdminActionMethod, Proposal} from "@workquest/database-models/lib/models";
import {output} from "../../utils";
import {Op} from "sequelize";
import saveAdminActions from "../../jobs/saveAdminActions";

export async function getDaoStatistic(r) {
  const where = {
    ...(r.query.statuses&& {status: {[Op.in]: r.query.statuses}})
  }
  const {count, rows} = await Proposal.findAndCountAll({
    where,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  if (r.method !== AdminActionMethod.Get) await saveAdminActions({ adminId: r.auth.credentials.id, method: r.method, path: r.path });

  return output({count, proposals: rows});
}

