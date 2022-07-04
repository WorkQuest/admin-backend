import { addJob } from '../utils/scheduler';

export type AdminDisputeStatisticPayload = {
  readonly adminId: string
  readonly resolutionTimeInSeconds: number,
};

export async function incrementAdminDisputeStatisticJob(payload: AdminDisputeStatisticPayload) {
  return addJob('incrementAdminDisputeStatistic', payload);
}


