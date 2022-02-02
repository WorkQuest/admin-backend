import { addJob } from '../utils/scheduler';
import { Quest, UserRole, QuestStatus, QuestsStatistic, activeFlowStatuses } from '@workquest/database-models/lib/models';

export interface Data {
  userId: string;
  role: UserRole;
}

type Statistic = {
  opened: number;
  completed: number;
};

export async function updateQuestsStatisticJob(payload: Data) {
  return addJob('updateQuestsStatistic', payload);
}

async function getWorkerQuestStatistic(workerId: string): Promise<Statistic> {
  const completedQuestsPromises = Quest.unscoped().count({
    where: {
      assignedWorkerId: workerId,
      status: QuestStatus.Done,
    },
  });
  const openedQuestsPromises = Quest.unscoped().count({
    where: {
      assignedWorkerId: workerId,
      status: activeFlowStatuses,
    },
  });

  const [completed, opened] = await Promise.all([completedQuestsPromises, openedQuestsPromises]);

  return { opened, completed };
}

async function getEmployerQuestStatistic(employerId: string): Promise<Statistic> {
  const completedQuestsPromises = Quest.unscoped().count({
    where: {
      userId: employerId,
      status: QuestStatus.Done,
    },
  });
  const openedQuestsPromises = Quest.unscoped().count({
    where: {
      userId: employerId,
      status: activeFlowStatuses,
    },
  });

  const [completed, opened] = await Promise.all([completedQuestsPromises, openedQuestsPromises]);

  return { opened, completed };
}

export default async function updateQuestsStatistic(payload: Data) {
  const [questsStatistic] = await QuestsStatistic.findOrCreate({
    where: { userId: payload.userId },
    defaults: { userId: payload.userId },
  });

  const statistic =
    payload.role === UserRole.Worker ? await getWorkerQuestStatistic(payload.userId) : await getEmployerQuestStatistic(payload.userId);

  await questsStatistic.update(statistic);
}
