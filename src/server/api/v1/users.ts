import {literal, Op} from 'sequelize'
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {UserController} from "../../controllers/controller.user";
import {
  Admin,
  BlackListStatus,
  Quest,
  QuestsResponse,
  QuestsResponseStatus,
  QuestStatus,
  Session,
  User,
  UserBlackList,
  UserChangeRoleData,
  UserRole,
  UserStatus
} from "@workquest/database-models/lib/models";
import {addJob} from "../../utils/scheduler";
import {saveAdminActionsMetadataJob} from "../../jobs/saveAdminActionsMetadata";

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

  return output({ count, users: rows });
}

export async function getUserSessions(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  const { rows, count } = await Session.findAndCountAll({
    include: { model: User, as: 'user' },
    limit: r.query.limit,
    offset: r.query.offset,
    where: { userId: user.id },
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, sessions: rows });
}

export async function getUsersSessions(r) {
  const searchByFirstAndLastNameLiteral = literal(
    `1 = (CASE WHEN EXISTS (SELECT "firstName", "lastName" FROM "Users" as "user" ` +
    `WHERE ("user"."firstName" || ' ' || "user"."lastName" ILIKE '%${r.query.q}%' OR "user"."role" ILIKE '%${r.query.q}%') AND "Session"."userId" = "user"."id") THEN 1 ELSE 0 END ) `,
  );
  const replacements = {};

  const where = {};

  const include = [{
    model: User,
    as: 'user'
  }];

  if (r.query.q) {
    where[Op.or] = searchByFirstAndLastNameLiteral;
    replacements['query'] = `%${r.query.q}%`;
  }

  const { rows, count } = await Session.findAndCountAll({
    where,
    include,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, sessions: rows });
}

export async function changeUserRole(r) {
  const user = await User.scope('withPassword').findByPk(r.params.userId)

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }
  if (!user.role) {
    return error(Errors.NoRole, 'The user does not have a role', {});
  }
  if (user.role === UserRole.Worker) {
    const questCount = await Quest.count({
      where: {
        assignedWorkerId: user.id,
        status: { [Op.notIn]: [QuestStatus.Closed, QuestStatus.Completed, QuestStatus.Blocked] }
      }
    });
    const questsResponseCount = await QuestsResponse.count({
      where: {
        workerId: user.id,
        status: { [Op.notIn]: [QuestsResponseStatus.Closed, QuestsResponseStatus.Rejected] }
      }
    });

    if (questCount !== 0) {
      return error(Errors.HasActiveQuests, 'User has active quests', { questCount });
    }
    if (questsResponseCount !== 0) {
      return error(Errors.HasActiveResponses, 'User has active responses', { questsResponseCount });
    }
  }
  if (user.role === UserRole.Employer) {
    const questCount = await Quest.count({
      where: { userId: user.id, status: { [Op.notIn]: [QuestStatus.Closed, QuestStatus.Completed] } }
    });

    if (questCount !== 0) {
      return error(Errors.HasActiveQuests, 'User has active quests', { questCount });
    }
  }

  const transaction = await r.server.app.db.transaction();

  const changeToRole = user.role === UserRole.Worker ? UserRole.Employer : UserRole.Worker;

  await UserChangeRoleData.create({
    changedAdminId: r.auth.credentials.id,
    userId: user.id,
    movedFromRole: user.role,
    additionalInfo: user.additionalInfo,
    wagePerHour: user.wagePerHour,
    workplace: user.workplace,
    priority: user.priority,
  }, { transaction });

  await user.update({
    workplace: null,
    wagePerHour: null,
    role: changeToRole,
    additionalInfo: UserController.getDefaultAdditionalInfo(changeToRole),
  }, { transaction });

  await transaction.commit();

  await addJob('deleteUserFilters', {
    userId: user.id,
  });
  await addJob('updateReviewStatistics', {
    userId: user.id,
  });
  await addJob('updateQuestsStatistic', {
    userId: user.id,
    role: user.role,
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function blockUser(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }
  if (user.status === UserStatus.Blocked) {
    return error(Errors.InvalidStatus, 'User already blocked', {});
  }

  await UserBlackList.create({
    userId: user.id,
    blockedByAdminId: r.auth.credentials.id,
    reason: r.payload.blockReason,
    userStatusBeforeBlocking: user.status,
  });

  await user.update({ status: UserStatus.Blocked });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function unblockUser(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }
  if (user.status !== UserStatus.Blocked) {
    return error(Errors.InvalidStatus, 'User is not blocked', {});
  }

  const userBlackList = await UserBlackList.findOne({
    where: { userId: user.id }, order: [['createdAt', 'DESC']],
  });

  if (userBlackList.status !== BlackListStatus.Blocked) {
    throw error(Errors.InvalidStatus, 'Internal error ', { userBlackList });
  }

  await user.update({ status: userBlackList.userStatusBeforeBlocking });

  await userBlackList.update({
    status: BlackListStatus.Unblocked,
    unblockedByAdminId: r.auth.credentials.id,
    unblockedAt: Date.now(),
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function getUserBlockingHistory(r) {
  const { rows, count } = await UserBlackList.findAndCountAll({
    where: { userId: r.params.userId },
    include: [{
      model: Admin,
      as: 'blockedByAdmin',
    }, {
      model: Admin,
      as: 'unblockedByAdmin'
    }],
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, blackLists: rows });
}
