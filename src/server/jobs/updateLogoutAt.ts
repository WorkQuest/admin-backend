import { addJob } from "../utils/scheduler";
import {AdminSession} from "@workquest/database-models/lib/models";

export interface id {
  sessionId: string,
}

export default async function updateLogoutAt(payload: id) {
  const session = await AdminSession.findByPk(payload.sessionId);
  await session.update({
    isActive: false,
    logoutAt: Date.now()
  })
}

export async function updateLogoutAtJob(payload: id) {
  return addJob('updateLogoutAt', payload)
}
