import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {getDefaultAdditionalInfo} from "../../utils/common";
import updateQuestsStatisticJob from '../../jobs/updateQuestsStatistic';
import addUpdateReviewStatisticsJob from '../../jobs/updateReviewStatistics';
import {
  User,
  Quest,
  Session,
  UserRole,
  QuestStatus,
  QuestsResponse,
  UserChangeRoleData,
  QuestsResponseStatus,
} from "@workquest/database-models/lib/models";

export async function getUser(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  return output(user);
}

export async function getUsers(r) {
  const { rows, count } = await User.findAndCountAll({
    distinct: true,
    col: '"User"."id"',
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, users: rows });
}

export async function getUserSessions(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  const { rows, count } = await Session.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    where: { userId: user.id },
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, sessions: rows });
}

export async function getUsersSessions(r) {
  const { rows, count } = await Session.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, sessions: rows });
}

export async function changeUserRole(r) {
  const user = await User.scope('withPassword').findByPk(r.params.userId)

  let invalidQuestStatus: any = []

  if (!(user.role === UserRole.Employer || user.role === UserRole.Worker)) {
    throw error(Errors.InvalidRole, "User isn't match role", {
      currentRole: user.role,
      requestedRole: UserRole,
    });
  }
  if (user.role === r.payload.role) {
    throw error(Errors.InvalidRole, "The user is already assigned this role", {
      currentRole: user.role,
      newRole: r.payload.role,
    });
  }
  if (user.role === UserRole.Employer) {
    const quests = await Quest.scope('defaultScope').findAll({
      where: { userId: user.id }
    });

    for (const quest of quests) {
      if (!(quest.status === QuestStatus.Done || quest.status === QuestStatus.Closed || quest.status === QuestStatus.Blocked)) {
        invalidQuestStatus.push({ questId: quest.id, status: QuestStatus[quest.status] });
      }
    }

    if (invalidQuestStatus.length !== 0) {
      return error(Errors.InvalidStatus, "Quest status does not match, it should be disabled", {
        invalidQuests: invalidQuestStatus
      });
    }
  }
  if (user.role === UserRole.Worker) {
    const questsResponses = await QuestsResponse.scope('defaultScope').findAll({
      where: { workerId: user.id }
    });

    for (const response of questsResponses) {
      if (!(response.status === QuestsResponseStatus.Rejected || response.status === QuestsResponseStatus.Closed)) {
        invalidQuestStatus.push({questResponseId: response.id, responseStatus: QuestsResponseStatus[response.status]})
      }
    }

    if (invalidQuestStatus.length !== 0) {
      return error(Errors.InvalidStatus, "The status of the response to the quest does not match, it should be changed", {
        invalidQuests: invalidQuestStatus
      });
    }
  }

  const transaction = await r.server.app.db.transaction();

  const userChangeRoleData = await UserChangeRoleData.create({
    changedAdminId: r.auth.credentials.id,
    userId: user.id,
    movedFromRole: user.role,
    additionalInfo: user.additionalInfo,

    ...(user.role === UserRole.Worker && {
      wagePerHour: user.wagePerHour,
      workplace: user.workplace,
      priority: user.priority
    }),
  }, { transaction });

  await user.update({
    role: user.role,
    additionalInfo: getDefaultAdditionalInfo(user.role),
    wagePerHour: null,
    workplace: null,
    priority: null,
  }, { transaction });

  await transaction.commit();

  await addUpdateReviewStatisticsJob({
    userId: user.id,
  });
  await updateQuestsStatisticJob({
    userId: user.id,
    role: user.role,
  });

  return output(user);
}

// TODO взять функционал из основоного бека
export async function changePhone(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  await user.update({
    phone: null,
    tempPhone: r.payload.newPhone,
  });
}

export async function blockUser(r) {
  throw new Error('Not implemented');
}

export async function unblockUser(r) {
  throw new Error('Not implemented');
}

export async function getUserBlockingHistory(r) {
  throw new Error('Not implemented');
}
