import { addJob } from "../utils/scheduler";
import {Admin} from "@workquest/database-models/lib/models";

export interface Info{
  admin: Admin,
  device: string,
  place: string,
}

export default async function updateDevicePlaceLoginAt(info: Info){
  await info.admin.update({
    loginAt: Date.now(),
    device: info.device,
    place: info.place,
  });
}

export async function updateDevicePlaceLoginAtJob(){
  return addJob('updateDevicePlaceLoginAt')
}
