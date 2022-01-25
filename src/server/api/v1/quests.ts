import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {Op} from "sequelize";
import {transformToGeoPostGIS} from "../../utils/postGIS";
import {QuestController} from "../../controllers/controller.quest";
import {MediaController} from "../../controllers/controller.media";
import {
  User,
  Media,
  Quest,
  QuestStatus,
  QuestBlackList,
  BlackListStatus,
} from "@workquest/database-models/lib/models";

export async function getQuests(r) {
  const where = {
    ...(r.params.userId && { userId: r.params.userId }),
    ...(r.params.workerId && { assignedWorkerId: r.params.workerId }),
  };

  const include = [{
    model: Media.scope('urlOnly'),
    as: 'medias',
    through: { attributes: [] }
  }, {
    model: User.scope('short'),
    as: 'user'
  }, {
    model: User.scope('short'),
    as: 'assignedWorker'
  }];

  const { rows, count } = await Quest.unscoped().findAndCountAll({
    include, where,
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, quests: rows });
}

export async function getQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, 'Quest not found',{});
  }

  return output(quest);
}

export async function editQuest(r) {
  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  const medias = await MediaController.getMedias(r.payload.medias);

  questController
    .questMustHaveStatus(QuestStatus.Created)

  const transaction = await r.server.app.db.transaction();

  await questController.setMedias(medias, transaction);
  await questController.setQuestSpecializations(r.payload.specializationKeys, false, transaction);

  questController.quest = await questController.quest.update({
    price: r.payload.price,
    title: r.payload.title,
    adType: r.payload.adType,
    priority: r.payload.priority,
    category: r.payload.category,
    workplace: r.payload.workplace,
    employment: r.payload.employment,
    description: r.payload.description,
    location: r.payload.location,
    locationPlaceName: r.payload.locationPlaceName,
    locationPostGIS: transformToGeoPostGIS(r.payload.location),
  }, { transaction });

  await transaction.commit();

  return output(questController.quest);
}

export async function deleteQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  questController
    .questMustHaveStatus(QuestStatus.Created, QuestStatus.Closed)


  // TODO: добавить удаления чатов и прочее
  // await QuestsResponse.destroy({ where: { questId: quest.id }, transaction });
  // await QuestMedia.destroy({ where: { questId: quest.id }, transaction });
  await quest.destroy();

  return output();
}

export async function blockQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);
  new QuestController(quest);

  await QuestBlackList.findOrCreate({
    where: {
      questId: quest.id,
      status: BlackListStatus.Blocked,
    },
    defaults: {
      questId: quest.id,
      adminId: r.auth.credentials.id,
      reason: r.payload.blockReason,
      previousQuestStatus: quest.status,
    }
  });

  await quest.update({ status: QuestStatus.Blocked});

  return output();
}

export async function unblockQuest(r) {
  const blockedQuest = await QuestBlackList.findOne({
    where: {
      [Op.and]: [{questId: r.params.questId}, {status: BlackListStatus.Blocked}]
    }
  });

  await blockedQuest.update({status: BlackListStatus.Unblocked});
  await Quest.update({status: blockedQuest.previousQuestStatus}, {where: {id: r.params.questId}});

  return output();
}
