import { AdminRole,
  Quest,
  QuestStatus,
  QuestsResponse,
} from "@workquest/database-models/lib/models";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import { getMedias } from "../../utils/medias";

export async function getQuestsList(r){
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);
  const {rows, count} = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, quests: rows });
}

export async function questInfo(r){
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  const quest = await Quest.findByPk(r.params.questId);
  if(!quest) {
    error(Errors.NotFound, 'Quest not found',{});
  }

  return(quest);
}

export async function editQuest(r){
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);
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

export async function deleteQuest(r){
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);
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
