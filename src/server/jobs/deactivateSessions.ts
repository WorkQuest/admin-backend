import { addJob } from "../utils/scheduler";
import {AdminSession} from "@workquest/database-models/lib/models";
import config from "../config/config";

export async function deactivateSessionsJob() {
  return addJob("deactivateSessions");
}

export default async function deactivateSessions() {
  const sessions = await AdminSession.findAndCountAll({
    where: {
      isActive: true,
    }
  })
  const milliseconds = config.auth.jwt.access.lifetime * 1000 //get milliseconds
  for(let i in sessions.rows){
    let sessionEnd = sessions.rows[i].createdAt.getTime() + milliseconds
    if(sessionEnd < Date.now()){
      await sessions.rows[i].update({
        isActive: false,
      })
    }
  }
}

