import {error, output} from "../../utils";
import {Admin} from "@workquest/database-models/lib/models"
import {Errors} from "../../utils/errors";
import saveAdminActions from "../../jobs/saveAdminActions";

export async function getMe(r) {
  return output(await Admin.findByPk(r.auth.credentials.id));
}

export async function editProfile(r) {
  const admin: Admin = r.auth.credentials;

  await admin.update(r.payload);

  await saveAdminActions({ adminId: r.auth.credentials.id, method: r.method, path: r.path });

  return output(await Admin.findByPk(admin.id));
}
