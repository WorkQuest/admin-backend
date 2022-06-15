import { addJob } from "../utils/scheduler";

type Statistics =
  | 'raiseView'
  | 'dispute'
  | 'report'
  | 'quest'
  | 'user'
  | 'dao'

type StatisticAction = 'increment' | 'decrement'

type WriteActionStatisticsPayload = {
  incrementField: string;
  statistic: Statistics;
  by?: number | string;
  type?: StatisticAction;
}

export async function writeActionStatistics(payload: WriteActionStatisticsPayload) {
  return addJob('writeActionStatistics', {
    incrementField: payload.incrementField,
    statistic: payload.statistic,
    by: payload.by,
    type: payload.type
  });
}
