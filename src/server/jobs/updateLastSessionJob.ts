import { addJob } from "../utils/scheduler";
import { Admin } from "@workquest/database-models/lib/models";
import {Errors} from "../utils/errors";
import {error} from "../utils";

export interface id {
  adminId: string
  sessionId: string,
}

export default async function updateLastSession(payload: id) {
  const admin = await Admin.findByPk(payload.adminId);
  if(!admin) {
    throw error(Errors.NotFound, 'Account is not found', {})
  }
  await admin.update({
    lastSessionId: payload.sessionId,
  });
}

export async function updateLastSessionJob(payload: id) {
  return addJob('updateLastSession', payload)
}
