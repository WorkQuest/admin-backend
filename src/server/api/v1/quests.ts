import {literal, Op} from "sequelize"
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {transformToGeoPostGIS} from "../../utils/postGIS";
import {QuestController} from "../../controllers/controller.quest";
import {MediaController} from "../../controllers/controller.media";
import {saveAdminActionsMetadataJob} from "../../jobs/saveAdminActionsMetadata";
import {
  User,
  Admin,
  Media,
  Quest,
  QuestStatus,
  QuestDispute,
  DisputeStatus,
  QuestBlackList,
  BlackListStatus,
} from "@workquest/database-models/lib/models";

export const searchQuestFields = [
  'title',
  'locationPlaceName'
];

export async function getQuests(r) {
  const userSearchLiteral = literal(
    `(SELECT "firstName" FROM "Users" WHERE "id" = "Quest"."userId") ILIKE '%${r.query.q}%'` +
    `OR (SELECT "lastName" FROM "Users" WHERE "id" = "Quest"."userId") ILIKE '%${r.query.q}%'`
  );

  const where = {
    ...(r.params.userId && { userId: r.params.userId }),
    ...(r.params.workerId && { assignedWorkerId: r.params.workerId }),
    ...(r.query.statuses && { status: { [Op.in]:  r.query.statuses } }),
    ...(r.query.priorities && { priority: { [Op.in]:  r.query.priorities } }),
  };

  if (r.query.q) {
    where[Op.or] = searchQuestFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    }));

    where[Op.or].push(userSearchLiteral)
  }

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
  }, {
    model: QuestDispute,
    as: 'openDispute',
    required: false,
    where: { status: [DisputeStatus.Created, DisputeStatus.InProgress] }
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
  const quest = await Quest.unscoped().findByPk(r.params.questId, {
    include: {
      model: QuestDispute,
      as: 'openDispute',
      where: {
        status: [DisputeStatus.Created, DisputeStatus.InProgress]
      },
      required: false,
    },
  });

  if (!quest) {
    return error(Errors.NotFound, 'Quest not found',{});
  }

  return output(quest);
}

export async function editQuest(r) {
  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  const medias = await MediaController.getMedias(r.payload.medias);

  questController
    .questMustHaveStatus(QuestStatus.Pending, QuestStatus.Recruitment)

  const transaction = await r.server.app.db.transaction();

  await questController.setMedias(medias, transaction);
  await questController.setQuestSpecializations(r.payload.specializationKeys, false, transaction);

  const avatarId = medias.length === 0
    ? null
    : medias[0].id

  questController.quest = await questController.quest.update({
    avatarId,
    title: r.payload.title,
    priority: r.payload.priority,
    workplace: r.payload.workplace,
    employment: r.payload.employment,
    location: r.payload.locationFull.location,
    locationPlaceName: r.payload.locationFull.locationPlaceName,
    locationPostGIS: transformToGeoPostGIS(r.payload.locationFull.location),
  }, { transaction });

  await transaction.commit();

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output(await Quest.findByPk(questController.quest.id));
}

export async function deleteQuest(r) {
  return error(Errors.Forbidden, 'Not implemented', {});
}

export async function blockQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (quest.status === QuestStatus.Blocked) {
    return error(Errors.InvalidStatus, 'Quest already blocked', {});
  }

  await QuestBlackList.create({
    questId: quest.id,
    blockedByAdminId: r.auth.credentials.id,
    reason: r.payload.blockReason,
    questStatusBeforeBlocking: quest.status,
  });

  await quest.update({ status: QuestStatus.Blocked });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function unblockQuest(r) {
  const quest = await Quest.findByPk(r.params.questId);

  if (!quest) {
    return error(Errors.NotFound, 'Quest is not found', {});
  }
  if (quest.status !== QuestStatus.Blocked) {
    return error(Errors.InvalidStatus, 'Quest already blocked', {});
  }

  const quesBlackList = await QuestBlackList.findOne({
    where: { questId: quest.id }, order: [['createdAt', 'DESC']],
  });
  if (quesBlackList.status !== BlackListStatus.Blocked) {
    throw error(Errors.InvalidStatus, 'Internal error ', { quesBlackList });
  }

  await quest.update({ status: quesBlackList.questStatusBeforeBlocking });

  await quesBlackList.update({
    status: BlackListStatus.Unblocked,
    unblockedByAdminId: r.auth.credentials.id,
    unblockedAt: Date.now(),
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function getQuestBlockingHistory(r) {
  const { rows, count } = await QuestBlackList.findAndCountAll({
    where: { questId: r.params.questId },
    include: [{
      model: Admin,
      as: 'blockedByAdmin',
    }, {
      model: Admin,
      as: 'unblockedByAdmin',
    }],
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, blackLists: rows });
}
