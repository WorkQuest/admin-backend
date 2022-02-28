import {output} from "../../utils";
import {Admin} from "@workquest/database-models/lib/models"
import {saveAdminActionsMetadataJob} from "../../jobs/saveAdminActionsMetadata";

export async function getMe(r) {
  return output(await Admin.findByPk(r.auth.credentials.id));
}

export async function editProfile(r) {
  const admin: Admin = r.auth.credentials;

  await admin.update(r.payload);

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output(await Admin.findByPk(admin.id));
}
