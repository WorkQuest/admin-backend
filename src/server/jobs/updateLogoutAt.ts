import { addJob } from "../utils/scheduler";
import {Admin} from "@workquest/database-models/lib/models";

export interface id{
  id: string
}

export default async function updateLogoutAt(payload: id) {
  const admin = await Admin.findByPk(payload.id);
  await admin.update({
    logoutAt: Date.now(),
  });
}

export async function updateLogoutAtJob(payload: id) {
  return addJob('updateLogoutAt', payload)
}
