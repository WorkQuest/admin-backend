import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {transformToGeoPostGIS} from "../../utils/postGIS";
import {QuestController} from "../../controllers/controller.quest";
import {MediaController} from "../../controllers/controller.media";
import {
  User,
  Quest,
  Media,
  QuestStatus,
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
    location: r.payload.locationFull.location,
    locationPlaceName: r.payload.locationFull.locationPlaceName,
    locationPostGIS: transformToGeoPostGIS(r.payload.locationFull.location),
  }, { transaction });

  await transaction.commit();

  return output(await Quest.findByPk(questController.quest.id));
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
  throw new Error('Not implemented');

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  questController
    .questMustHaveStatus()

  // const blockedQuest = await QuestBlockReason.create({
  //   questId: quest.id,
  //   blockReason: r.payload.blockReason,
  //   previousStatus: quest.status,
  // });

  // await quest.update({ status: });

  // return output();
}

export async function unblockQuest(r) {
  throw new Error('Not implemented');

  // const quest = await Quest.findByPk(r.params.questId);
  //
  // if (!quest) {
  //   return error(Errors.NotFound, "Quest is not found", {});
  // }
  //
  // if(quest.status !== QuestStatus.isBlocked) {
  //   return error(Errors.InvalidStatus, "Quest is unblocked", {});
  // }
  //
  // const blockedQuest = await QuestBlockReason.findOne({
  //   where: {
  //     questId: quest.id,
  //   },
  //   order:[ ['createdAt', 'DESC'] ],
  // });
  //
  // await quest.update({ status: blockedQuest.previousStatus });
  //
  // return output();
}
