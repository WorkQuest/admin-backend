import {
  Quest,
  QuestStatus,
  QuestsResponse,
  QuestMedia, User,
} from "@workquest/database-models/lib/models";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import { getMedias } from "../../utils/medias";
import {Op} from "sequelize";

export async function getQuestsList(r) {
  const {rows, count} = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, quests: rows });
}

export async function questInfo(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if(!quest) {
    return error(Errors.NotFound, 'Quest not found',{});
  }

  return output(quest);
}

export async function getUserQuestsInfo(r) {
  const quests = await Quest.findAndCountAll({
    where: {
      [Op.or]: [{userId: r.params.userId}, {assignedWorkerId: r.params.userId}],
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count: quests.count, quests: quests.rows });
}

//TODO change logic
export async function editQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  const transaction = await r.server.app.db.transaction();

  if(!quest) {
    return error(Errors.NotFound, 'Quest not found',{});
  }
  quest.mustHaveStatus(QuestStatus.Created);

  if(r.payload.medias) {
    const medias = await getMedias(r.payload.medias);

    await quest.$set('medias', medias, { transaction });
  }

  await quest.update(r.payload, { transaction });
  await transaction.commit();

  return output(quest);
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

  //TODO maybe made quest and response paranoid?
  await QuestsResponse.destroy({ where: { questId: quest.id }, transaction });
  await QuestMedia.destroy({ where: { questId: quest.id } });
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

//TODO добавить разблокировку квеста
//TODO узнать, может ли пользователь узнать о причинах блокировки и надо ли будет выводить ему это


