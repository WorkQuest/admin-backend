import { col, fn } from 'sequelize';
import { addJob } from '../utils/scheduler';
import { User, Quest, Review, UserRole, StatusKYC, QuestStatus, RatingStatus, RatingStatistic } from '@workquest/database-models/lib/models';

/**
 * 1 уровень Verified.
 *   Выполнить не менее 10 квестов.
 *   Каждый выполненный квест оценен не менее, чем на 3,5 балла.
 *   Средняя оценка у пользователя не менее, чем 3,5.
 *   Прохождение KYC (верифицированный аккаунт).
 *   Заполнение соцсетей (добавлено 1 соцсеть).
 *
 *  2 уровень Reliable.
 *    Выполнить не менее 20 квестов.
 *    Каждый выполненный квест оценен не менее, чем на 4 балла.
 *    Средняя оценка не менее 4.
 *    Прохождение KYC (верифицированный аккаунт).
 *    Верификация номера телефона.
 *    Заполнение соцсетей (добавлено 2 соцсети).
 *
 *  3 уровень Top Ranked.
 *    Выполнить не менее 30 квестов. Каждый выполненный квест не менее, чем на 4,5 балла.
 *    Средняя оценка не менее 4,5
 *    Прохождение KYC (верифицированный аккаунт).
 *    Верификация номера телефона.
 *    Заполнение соцсетей (добавлено 3 соцсети).
 *    Заполнение Employment information
 */

export interface StatisticPayload {
  userId: string;
}

export async function addUpdateReviewStatisticsJob(payload: StatisticPayload) {
  return addJob('updateReviewStatistics', payload);
}

type RatingConditions = {
  completedQuests: number;
  averageMark: number;
  socialNetworks: number;
};

const RatingConditions = class {
  constructor(public readonly user: User, public readonly completedQuestsCount: number, public readonly averageMark: number) {}

  public check(conditions: RatingConditions): boolean {
    const socialNetworks = Object.values(this.user['additionalInfo']['socialNetwork']).filter((network) => network !== null).length;

    return (
      this.completedQuestsCount >= conditions.completedQuests &&
      this.averageMark >= conditions.averageMark &&
      socialNetworks >= conditions.socialNetworks
    );
  }
};

function ratingStatus(user: User, completedQuestsCount: number, averageMark: number): RatingStatus {
  const thisUser = new RatingConditions(user, completedQuestsCount, averageMark);

  const topRankedConditions: RatingConditions = { completedQuests: 30, averageMark: 4.5, socialNetworks: 3 };
  const reliableConditions: RatingConditions = { completedQuests: 20, averageMark: 4, socialNetworks: 2 };
  const verifiedConditions: RatingConditions = { completedQuests: 10, averageMark: 3.5, socialNetworks: 1 };

  if (user.statusKYC !== StatusKYC.Confirmed) {
    return RatingStatus.noStatus;
  }
  if (thisUser.check(verifiedConditions) && !user.phone) {
    return RatingStatus.verified;
  }

  if (thisUser.check(topRankedConditions)) {
    return RatingStatus.topRanked;
  }
  if (thisUser.check(reliableConditions)) {
    return RatingStatus.reliable;
  }
  if (thisUser.check(verifiedConditions)) {
    return RatingStatus.verified;
  }

  return RatingStatus.noStatus;
}

export default async function (payload: StatisticPayload) {
  const [ratingStatistic] = await RatingStatistic.findOrCreate({
    include: { model: User, as: 'user' },
    where: { userId: payload.userId },
    defaults: { userId: payload.userId },
  });

  const user: User = ratingStatistic.user;

  const reviewCountPromise = Review.count({ where: { toUserId: user.id } });
  const averageMarkResultPromise = Review.findOne({
    attributes: [[fn('AVG', col('mark')), 'avgMark']],
    where: { toUserId: ratingStatistic.userId },
  });
  const completedQuestsCountPromise = Quest.count({
    where: {
      ...(user.role === UserRole.Employer && { userId: user.id }),
      ...(user.role === UserRole.Worker && { assignedWorkerId: user.id }),
      status: QuestStatus.Done,
    },
  });

  const [reviewCount, completedQuestsCount, averageMarkResult] = await Promise.all([
    reviewCountPromise,
    completedQuestsCountPromise,
    averageMarkResultPromise,
  ]);

  const status = ratingStatus(user, completedQuestsCount, averageMarkResult.getDataValue('avgMark'));

  await ratingStatistic.update({
    status,
    reviewCount,
    averageMark: averageMarkResult.getDataValue('avgMark'),
  });
}
