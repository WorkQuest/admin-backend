import { addJob } from "../utils/scheduler";
import {Admin} from "@workquest/database-models/lib/models";

export default async function updateLogoutAt(admin: Admin){
  await admin.update({
    logoutAt: Date.now(),
  });
}

export async function updateLogoutAtJob(){
  return addJob('updateLogoutAt')
}
