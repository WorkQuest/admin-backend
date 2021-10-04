import { addJob } from "../utils/scheduler";
import {Quest, QuestStatus} from "@workquest/database-models/lib/models";
const schedule = require('node-schedule')

export interface ProlongedQuestTill {
  questId: string,
  prolongedTill: Date,
}
export async function updateQuestStatusJob(payload: ProlongedQuestTill) {
  return addJob("updateQuestStatus", payload)
}

export default async function updateQuestStatus(payload: ProlongedQuestTill) {
  schedule.scheduleJob(payload.prolongedTill, async () => {
    await Quest.update({
      status: QuestStatus.Dispute,
    }, {
      where: {
        id: payload.questId
      }
    })
  });
}


