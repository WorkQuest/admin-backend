import {addJob} from '../utils/scheduler';
import {
  AdminQuestDisputesStatistic
} from '@workquest/database-models/lib/models';
import {log} from "util";

export type adminDisputeStatisticPayload = {
  adminId: string
  resolutionTimeInSeconds: number,
};

export async function incrementAdminDisputeStatisticJob(payload: adminDisputeStatisticPayload) {
  return addJob('incrementAdminDisputeStatistic', payload);
}

export default async function incrementAdminDisputeStatistic(payload: adminDisputeStatisticPayload) {
  const [questDisputeStatistic, isCreated] = await AdminQuestDisputesStatistic.findOrCreate({
    where: { adminId: payload.adminId },
    defaults: {
      adminId: payload.adminId,
      averageResolutionTimeInSeconds: payload.resolutionTimeInSeconds,
      resolvedQuestDisputes: 0
    }
  });

  console.log(questDisputeStatistic)

  if (!isCreated) {
    const averageResolutionTimeInSeconds = (questDisputeStatistic.averageResolutionTimeInSeconds *
       questDisputeStatistic.resolvedQuestDisputes + payload.resolutionTimeInSeconds) / (questDisputeStatistic.resolvedQuestDisputes + 1);
    await questDisputeStatistic.update({ averageResolutionTimeInSeconds });
  }

  await questDisputeStatistic.increment('resolvedQuestDisputes');
}
