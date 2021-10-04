import {
  Quest,
  QuestStatus,
  QuestsResponse, ProlongedQuest,
} from "@workquest/database-models/lib/models";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import { getMedias } from "../../utils/medias";
import {updateQuestStatusJob} from "../../jobs/updateQuestStatus";

export async function getQuestsList(r){
  const {rows, count} = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, quests: rows });
}

export async function questInfo(r) {

  const quest = await Quest.findByPk(r.params.questId);
  if(!quest) {
    error(Errors.NotFound, 'Quest not found',{});
  }

  return output(quest);
}

export async function getUserQuestsInfo(r) {
  const quests = await Quest.findAndCountAll({
    where: {
      userId: r.params.userId,
    },
    limit: r.query.limit,
    offset: r.query.offset,
  })

  if(!quests) {
    return error(Errors.NotFound, "Disputes are not found", {});
  }

  return output({ count: quests.count, disputes: quests.rows });
}

export async function editQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  const transaction = await r.server.app.db.transaction();

  if(!quest) {
    error(Errors.NotFound, 'Quest not found',{});
  }
  quest.mustHaveStatus(QuestStatus.Created);

  if(r.payload.medias) {
    const medias = await getMedias(r.payload.medias);

    await quest.$set('medias', medias, { transaction });
  }
  quest.updateFieldLocationPostGIS();

  await quest.update(r.payload, { transaction });
  await transaction.commit();

  return output(
    await Quest.findByPk(quest.id)
  )
}

export async function deleteQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  const transaction = await r.server.app.db.transaction();
  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  if (quest.status !== QuestStatus.Created && quest.status !== QuestStatus.Closed) {
    return error(Errors.InvalidStatus, "Quest cannot be deleted at current stage", {});
  }

  await QuestsResponse.destroy({ where: { questId: quest.id }, transaction })
  await quest.destroy({ force: true, transaction });

  await transaction.commit();

  return output();
}

export async function blockQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  if (!quest) {
    return error(Errors.NotFound, "Quest not found", {});
  }

  if (quest.status !== QuestStatus.Created && quest.status !== QuestStatus.Closed) {
    return error(Errors.InvalidStatus, "Quest cannot be deleted at current stage", {});
  }

  //TODO добавить проверку на статус квеста, чтобы блокировать квесты определённого статуса
  await quest.update({
    isBlocked: true,
    blockReason: r.payload.blockReason,
  })

  return output();
}

export async function prolongQuest(r) {
//TODO function
  const transaction = await r.server.app.db.transaction();

  const [prolong, isAlreadyProlonged] = await ProlongedQuest.findOrCreate({
    where: {
      questId: r.params.questId,
    }, transaction,
  });

  if(!isAlreadyProlonged) {
    return error(Errors.AlreadyExist, 'Quest may be prolonged just once', {});
  }

  const minDate = new Date(Date.now() + 259200000).getDate(); //Date.now() + 3 days in timestamp
  const maxDate = new Date(Date.now() + 432000000).getDate(); //Date.now() + 5 days in timestamp
  const prolongedTill = new Date(r.payload.prolongedTill).getDate();
  const a = Date.now()
  console.log(a)

  const isRightDate = prolongedTill === minDate ? true : (prolongedTill === maxDate);

  if(!isRightDate) {
    return error(Errors.InvalidDate, 'Quest may be prolonged for 3 or 5 days', {});
  }

  await prolong.update({
    prolongedTill: r.payload.prolongedTill
  }, {transaction});

  await updateQuestStatusJob({
    questId: r.params.questId,
    prolongedTill: r.payload.prolongedTill
  });

  await transaction.commit();

  return output();
}

//TODO добавить разблокировку квеста
//TODO узнать, может ли пользователь узнать о причинах блокировки и надо ли будет выводить ему это


