import {Op} from 'sequelize',
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {UserController} from "../../controllers/controller.user";
import {addUpdateReviewStatisticsJob} from "../../jobs/updateReviewStatistics";
import {updateQuestsStatisticJob} from "../../jobs/updateQuestsStatistic";
import {
  User,
  Quest,
  Admin,
  Session,
  UserRole,
  UserStatus,
  QuestStatus,
  UserBlackList,
  QuestsResponse,
  BlackListStatus,
  UserChangeRoleData,
  QuestsResponseStatus
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
  const { rows, count } = await Session.findAndCountAll({
    include: { model: User, as: 'user' },
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, sessions: rows });
}

export async function changeUserRole(r) {
  const user = await User.scope('withPassword').findByPk(r.params.userId)

  if (user.role === r.payload.role) {
    throw error(Errors.InvalidRole, "The user is already assigned this role", {
      currentRole: user.role
    });
  }
  if (user.role === UserRole.Worker) {
    const questCount = await Quest.count({
      where: { workerId: user.id, status: { [Op.ne]: [QuestStatus.Closed, QuestStatus.Done] } }
    });
    const questsResponseCount = await QuestsResponse.count({
      where: { workerId: user.id, status: { [Op.ne]: [QuestsResponseStatus.Closed, QuestsResponseStatus.Rejected] } }
    })

    if (questCount !== 0) {
      throw error()
    }
    if (questsResponseCount !== 0) {
      throw error()
    }
  }
  if (user.role === UserRole.Employer) {
    const questCount = await Quest.count({
      where: { userId: user.id, status: { [Op.ne]: [QuestStatus.Closed, QuestStatus.Done] } }
    });

    if (questCount !== 0) {
      throw error()
    }
  }

  const transaction = await r.server.app.db.transaction();

  await UserChangeRoleData.create({
    changedAdminId: r.auth.credentials.id,
    userId: user.id,
    movedFromRole: user.role,
    additionalInfo: user.additionalInfo,
    wagePerHour: user.wagePerHour,
    workplace: user.workplace,
    priority: user.priority,
  }, { transaction });

  if (user.role === UserRole.Worker) {
    await user.update({
      workplace: null,
      wagePerHour: null,
      role: UserRole.Employer,
      additionalInfo: UserController.getDefaultAdditionalInfo(UserRole.Employer),
    }, { transaction });
  }
  if (user.role === UserRole.Employer) {
    await user.update({
      workplace: null,
      wagePerHour: null,
      role: UserRole.Worker,
      additionalInfo: UserController.getDefaultAdditionalInfo(UserRole.Worker),
    }, { transaction });
  }

  await transaction.commit();

  await addUpdateReviewStatisticsJob({
    userId: user.id,
  });
  await updateQuestsStatisticJob({
    userId: user.id,
    role: user.role,
  });

  return output();
}

export async function changePhone(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {userId: r.params.userId});
  }

  await user.update({
    phone: null,
    tempPhone: r.payload.newPhone,
  });
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

  return output();
}

export async function unblockUser(r) {
  const admin: Admin = r.auth.credentials.id;
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
    unblockedByAdminId: admin.id,
    unblockedAt: Date.now(),
  });

  return output();
}

export async function getUserBlockingHistory(r) {
  const { rows, count } = await UserBlackList.findAndCountAll({
    where: { userId: r.params.userId },
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, blackLists: rows });
}
