import { addJob } from "../utils/scheduler";

type Statistics =
  | 'raiseView'
  | 'dispute'
  | 'report'
  | 'quest'
  | 'user'
  | 'dao'

type StatisticAction = 'increment' | 'decrement'

export async function writeActionStatistics(incrementField, statistic: Statistics, by: string | number = 1, type: StatisticAction = 'increment') {
  return addJob('writeActionStatistics', { incrementField, statistic, by, type });
}
