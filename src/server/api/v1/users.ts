import { literal, Op } from 'sequelize'
import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import { UserController } from "../../controllers/controller.user";
import {
  Admin,
  BlackListStatus,
  Quest,
  QuestsResponse,
  QuestsResponseStatus,
  QuestStatus, RatingStatistic,
  Session,
  StatusKYC,
  User,
  UserBlackList,
  UserChangeRoleData,
  UserRole,
  UserStatus
} from "@workquest/database-models/lib/models";
import { addJob } from "../../utils/scheduler";
import { saveAdminActionsMetadataJob } from "../../jobs/saveAdminActionsMetadata";

export const searchFields = [
  "firstName",
  "lastName",
  "email",
  "locationPlaceName",
];

export async function getUser(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  return output(user);
}

export async function getAllUsers(r) {
  const searchByFullNameLiteral = literal(`
    concat("User"."firstName", "User"."lastName") ILIKE replace('%${r.query.q}%', ' ', '')
  `);

  const order = [];
  const include = [];
  let distinctCol: '"User"."id"' | "id" = '"User"."id"';
  const where = {
    ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
    ...(r.query.role && { role: r.query.role }),
    ...(r.query.smsVerification && { phone: { [Op.ne]: null } }),
  }

  if (r.query.statusKYC === StatusKYC.Unconfirmed || r.query.statusKYC === StatusKYC.Confirmed) {
    where[Op.and] = { statusKYC: r.query.statusKYC };
  }

  if (r.query.q) {
    where[Op.or] = searchFields.map(
      field => ({ [field]: { [Op.iLike]: `%${r.query.q}%` }})
    );

    where[Op.or].push(searchByFullNameLiteral);
  }

  if (r.query.sort) {
    for (const [key, value] of Object.entries(r.query.sort || {})) {
      order.push([key, value]);
    }
  }

  if (r.query.ratingStatuses) {
    include.push({
      model: RatingStatistic,
      as: 'ratingStatistic',
      required: true,
      where: { status: r.query.ratingStatuses },
    });

    distinctCol = "id";
  }

  if (order.length === 0) {
    order.push(['createdAt', 'DESC'])
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include,
    col: distinctCol,
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    order,
  });

  return output({ count, users: rows });
}

export function getUsers(role: UserRole) {
  return async function(r) {
    const searchByFullNameLiteral = literal(`
    concat("User"."firstName", "User"."lastName") ILIKE replace('%${r.query.q}%', ' ', '')
  `);

    const order = [];

    const where = {
      [Op.and]: [],
      role,
      ...(r.query.statuses && { status: { [Op.in]:  r.query.statuses } }),
      ...(r.query.smsVerification && { phone: { [Op.ne]: null } }),
    };

    if (r.query.statusKYC === StatusKYC.Unconfirmed || r.query.statusKYC === StatusKYC.Confirmed) {
      where[Op.and].push({ statusKYC: r.query.statusKYC });
    }

    if (role === UserRole.Worker && r.query.payPeriod) {
      where[Op.and].push({ payPeriod: r.query.payPeriod});
    }

    if (r.query.q) {
      where[Op.or] = searchFields.map(
        field => ({ [field]: { [Op.iLike]: `%${r.query.q}%` }})
      );

      where[Op.or].push(searchByFullNameLiteral);
    }

    if (r.query.sort) {
      for (const [key, value] of Object.entries(r.query.sort || {})) {
        order.push([key, value]);
      }
    }

    if (order.length === 0) {
      order.push(['createdAt', 'DESC'])
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      distinct: true,
      col: '"User"."id"',
      limit: r.query.limit,
      offset: r.query.offset,
    });

      return output({ count, users: rows });
    };
}

export async function getUserSessions(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  const { rows, count } = await Session.findAndCountAll({
    distinct: true,
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
    distinct: true,
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
    costPerHour: user.costPerHour,
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
