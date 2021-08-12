import { addJob } from "../utils/scheduler";
import {Admin} from "@workquest/database-models/lib/models";

export interface id{
  id: string
}

export default async function updateLoginAt(payload: id) {
  const admin = await Admin.findByPk(payload.id);
  await admin.update({
    loginAt: Date.now(),
  });
}

export async function updateLoginAtJob(payload: id) {
  return addJob('updateLoginAt', payload)
}
