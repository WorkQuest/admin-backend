import BigNumber from 'bignumber.js';
import { output } from "../../utils";
import { col, fn, Op } from "sequelize";
import {
  DaoPlatformStatistic,
  UsersPlatformStatistic,
  QuestsPlatformStatistic,
  ReportsPlatformStatistic,
  DisputesPlatformStatistic,
  RaiseViewsPlatformStatistic,
  UsersPlatformStatisticFields
} from "@workquest/database-models/lib/models";

const statisticModels = {
  dao: DaoPlatformStatistic,
  users: UsersPlatformStatistic,
  quests: QuestsPlatformStatistic,
  reports: ReportsPlatformStatistic,
  disputes: DisputesPlatformStatistic,
  raiseView: RaiseViewsPlatformStatistic,
}

export async function getAllowedDates(r) {
  const dates = await statisticModels[r.params.statistic].findOne({
    attributes: [
      [fn('MIN', col('date')), 'minDate'],
      [fn('MAX', col('date')), 'maxDate'],
    ]
  });

  return output({
    minDate: dates.getDataValue('minDate'),
    maxDate: dates.getDataValue('maxDate')
  });
}

export async function getPlatformStatistic(r) {
  const where = {
    ...(r.query.dateTo && { date: new Date(r.query.dateTo) }),
    ...(r.query.dateFrom && { date: { [Op.in]: [r.query.dateFrom, r.query.dateTo] } })
  };

  const [dateToStatistic, dateFromStatistic] = await statisticModels[r.params.statistic].findAll({
    where,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    limit: r.query.dateFrom ? 2 : 1,
    order: [['date', 'DESC']],
  });

  const statisticTo = dateToStatistic.toJSON();
  const statisticFrom = dateFromStatistic ? dateFromStatistic.toJSON() : null;

  for (const statisticKey in statisticTo) {
    if (statisticKey === 'date') {
      if (statisticFrom) {
        statisticTo['period'] = {
          from: dateFromStatistic.date,
          to: dateToStatistic.date
        }

        delete statisticTo['date'];
      }

      continue;
    }

    if (statisticFrom) {
      const toValue = new BigNumber(statisticTo[statisticKey]);
      const fromValue = new BigNumber(statisticFrom[statisticKey]);

      if (statisticKey === UsersPlatformStatisticFields.AverageSessionTime) {
        const avg = await UsersPlatformStatistic.findOne({
          attributes: [[fn('AVG', col(UsersPlatformStatisticFields.AverageSessionTime)), 'averageSessionTime']],
          where: { date: { [Op.between]: [dateFromStatistic.date, dateToStatistic.date] } }
        });

        statisticTo[statisticKey] = avg.averageSessionTime.toString();

        continue;
      }

      statisticTo[statisticKey] = toValue.minus(fromValue).toString();

      continue;
    }

    statisticTo[statisticKey] = new BigNumber(statisticTo[statisticKey]).toString();
  }

  return output(statisticTo);
}