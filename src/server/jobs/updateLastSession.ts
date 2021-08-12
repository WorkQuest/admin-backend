import { addJob } from "../utils/scheduler";
import {Admin, AdminSession} from "@workquest/database-models/lib/models";

export interface ids {
  adminId: string,
  sessionId: string,
}

export default async function updateLastSession(payload: ids) {
  const admin = await Admin.findByPk(payload.adminId);
  const session = await AdminSession.findByPk(payload.sessionId);
  await admin.update({
    lastSession: {
      id: session.id,
      adminId: session.adminId,
      place: session.place,
      device: session.device,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
  });
}

export async function updateLastSessionJob(payload: ids) {
  return addJob('updateLastSession', payload)
}
