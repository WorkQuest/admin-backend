import { addJob } from "../utils/scheduler";
import { Session } from "@workquest/database-models/lib/models";
import {literal, Op} from "sequelize";
import {now} from "moment";
import config from "../config/config";

export async function deactivateSessionsJob() {
  return addJob("deactivateSessions");
}

export default async function deactivateSessions() {
  // //TODO
  //where createdAt + lifetime < Date.now()
  // const sessions = await Session.findAndCountAll({
  //   where: {
  //     isActive: true,
  //   },
  //   having: {
  //     createAt
  //   }
  // });
  // console.log(sessions.rows)
  // // for(let i in sessions.rows){
  // //   console.log(typeof sessions.rows[i])
  // //   await sessions.rows[i].update({
  // //     isTrue: false,
  // //   });
  // // }
}

