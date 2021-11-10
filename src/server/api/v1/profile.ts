import {error, output} from "../../utils";
import {Admin, DisputeStatus, QuestDispute} from "@workquest/database-models/lib/models"
import {Errors} from "../../utils/errors";

export async function getMe(r){
  return output(await Admin.findByPk(r.auth.credentials.id));
}

export async function editProfile(r){
  const admin = await Admin.findByPk(r.auth.credentials.id);

  if(!admin) {
    return error(Errors.NotFound, 'Profile is not found', {});
  }

  await admin.update(r.payload);

  return output(await Admin.findByPk(r.auth.credentials.id));
}
