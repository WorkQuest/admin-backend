import { addJob } from '../utils/scheduler';
import { AdminQuestDisputesStatistic } from '@workquest/database-models/lib/models';

export type AdminDisputeStatisticPayload = {
  readonly adminId: string
  readonly resolutionTimeInSeconds: number,
};

export async function incrementAdminDisputeStatisticJob(payload: AdminDisputeStatisticPayload) {
  return addJob('incrementAdminDisputeStatistic', payload);
}

export default async function incrementAdminDisputeStatistic(payload: AdminDisputeStatisticPayload) {
  const [questDisputeStatistic, isCreated] = await AdminQuestDisputesStatistic.findOrCreate({
    where: { adminId: payload.adminId },
    defaults: {
      adminId: payload.adminId,
      resolvedQuestDisputes: 0,
      averageResolutionTimeInSeconds: payload.resolutionTimeInSeconds,
    }
  });

  if (!isCreated) {
    const averageResolutionTimeInSeconds = (
      questDisputeStatistic.averageResolutionTimeInSeconds * questDisputeStatistic.resolvedQuestDisputes
      +
      payload.resolutionTimeInSeconds
    ) / ( questDisputeStatistic.resolvedQuestDisputes + 1 )

    await questDisputeStatistic.update({ averageResolutionTimeInSeconds });
  }

  await questDisputeStatistic.increment('resolvedQuestDisputes');
}
