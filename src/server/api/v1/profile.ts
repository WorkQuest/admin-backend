import {error, output} from "../../utils";
import {Admin, DisputeStatus, QuestDispute} from "@workquest/database-models/lib/models"
import {Errors} from "../../utils/errors";
import {Op} from "sequelize";


export async function getMe(r){
  const admin = await Admin.findByPk(r.auth.credentials.id);

  if(!admin) {
    return error(Errors.NotFound, 'Profile is not found', {});
  }

  return output(admin);
}

export async function editProfile(r){
  const admin = await Admin.findByPk(r.auth.credentials.id);

  if(!admin) {
    return error(Errors.NotFound, 'Profile is not found', {});
  }

  await admin.update(r.payload);

  return output(
    await Admin.findByPk(r.auth.credentials.id)
  );
}

export async function adminResolvedDisputes(r){
  const disputes = await QuestDispute.findAndCountAll({
    where: {
      [Op.or]: [ {status: DisputeStatus.completed}, {resolvedByAdminId: r.auth.credentials.id}]
    },
    limit: r.query.limit,
    offset: r.query.offset,
  })

  if(!disputes) {
    return error(Errors.NotFound, "Disputes are not found", {});
  }

  return output({ count: disputes.count, disputes: disputes.rows });


}
