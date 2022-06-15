import BigNumber from 'bignumber.js';
import { col, fn, Op } from "sequelize";
import { QuestsPlatformStatistic, UsersPlatformStatistic } from "@workquest/database-models/lib/models";
import { output } from "../../utils";

export async function getAllowedDates(r) {
  const dates = await r.server.app.db.models[r.query.statistic].findOne({
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

export async function getUsersPlatformStatistic(r) {
  const where = {
    ...(r.query.dateTo && { date: new Date(r.query.dateTo) }),
    ...(r.query.dateFrom && { date: { [Op.in]: [r.query.dateFrom, r.query.dateTo] } })
  };

  const [dateToStatistic, dateFromStatistic] = await r.server.app.db.models[r.query.statistic].findAll({
    where,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    limit: r.query.dateFrom ? 2 : 1,
    order: [['date', 'DESC']],
  });

  const statisticTo = dateToStatistic.toJSON();

  if (dateFromStatistic) {
    const statisticFrom = dateFromStatistic.toJSON();

    for (const statisticKey in statisticTo) {
      if (statisticKey === 'date') {
        statisticTo['period'] = {
          from: dateFromStatistic.date,
          to: dateToStatistic.date
        }

        delete statisticTo['date'];

        continue;
      }

      const toValue = new BigNumber(statisticTo[statisticKey]);
      const fromValue = new BigNumber(statisticFrom[statisticKey]);

      statisticTo[statisticKey] = toValue.minus(fromValue).toString();
    }
  }

  return output(statisticTo);
}

export async function getQuestsPlatformStatistic(r) {
  const where = {
    ...(r.query.dateTo && { date: new Date(r.query.dateTo) }),
    ...(r.query.dateFrom && { date: { [Op.in]: [r.query.dateFrom, r.query.dateTo] } })
  };

  const [dateToStatistic, dateFromStatistic] = await QuestsPlatformStatistic.findAll({
    where,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    limit: r.query.dateFrom ? 2 : 1,
    order: [['date', 'DESC']],
  });

  const statisticTo = dateToStatistic.toJSON();

  if (dateFromStatistic) {
    const statisticFrom = dateFromStatistic.toJSON();

    for (const statisticKey in statisticTo) {
      if (statisticKey === 'date') {
        statisticTo['period'] = {
          from: dateFromStatistic.date,
          to: dateToStatistic.date
        }

        delete statisticTo['date'];

        continue;
      }

      const toValue = new BigNumber(statisticTo[statisticKey]);
      const fromValue = new BigNumber(statisticFrom[statisticKey]);

      statisticTo[statisticKey] = toValue.minus(fromValue).toString();
    }
  }

  return output(statisticTo);
}