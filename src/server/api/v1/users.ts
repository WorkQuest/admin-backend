import {error, output, responseHandler} from "../../utils";
import {Errors} from "../../utils/errors";
import {
  AdminChangeRole,
  Quest,
  QuestsResponse, QuestsResponseStatus,
  QuestStatus,
  User,
  UserRole
} from "@workquest/database-models/lib/models";
import {UserController} from "../../controllers/controller.user";

export async function getUser(r) {
  const user = await User.findByPk(r.params.userId);

  if (!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  return output(user);
}

export async function getUsers(r) {
  const {rows, count} = await User.findAndCountAll({
    distinct: true,
    col: '"User"."id"',
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({count: count, users: rows});
}

export async function changeUserRole(r) {

  const user = await User.scope('withPassword').findByPk(r.params.userId)
  const userController = new UserController(user);

  let invalidQuestStatus: any = []

  if (!(user.role === UserRole.Employer || user.role === UserRole.Worker)) {
    throw error(Errors.InvalidRole, "User isn't match role", {
      currentRole: user.role,
      requestedRole: UserRole,
    });
  }

  if (user.role === r.payload.role ) {
    throw error(Errors.InvalidRole, "The user is already assigned this role", {
      currentRole: user.role,
      newRole: r.payload.role,
    });
  }

  await userController.userMustHaveActiveStatusTOTP(false);
  await userController.checkTotpConfirmationCode(r.payload.totp);

  if (user.role === UserRole.Employer) {
    const {rows} = await Quest.scope('defaultScope').findAndCountAll({
      where: {userId: user.id}
    })
    for (const quest of rows) {
      if (!(quest.status === QuestStatus.Done || quest.status === QuestStatus.Closed || quest.status === QuestStatus.Blocked)) {
        invalidQuestStatus.push({questId: quest.id, status: QuestStatus[quest.status]})
      }
    }
    if (invalidQuestStatus.length !== 0) {
      return error(Errors.InvalidStatus, "Quest status does not match, it should be disabled", {
        invalidQuests: invalidQuestStatus
      });
    }
  }

  if (user.role === UserRole.Worker) {
    const {rows} = await QuestsResponse.scope('defaultScope').findAndCountAll({
      where: {workerId: user.id}
    })
    for (const response of rows) {
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

  const [changeRole, isCreated] = await AdminChangeRole.findOrCreate({
    where: {userId: user.id},
    defaults: {
      adminId: '4ba343e5-1111-1111-1111-ae396a5ecc3d',//r.auth.credentials.id, TODO add this params
      userId: user.id,
      role: user.role,
      additionalInfo: user.additionalInfo,
      wagePerHour: user.wagePerHour,
      workplace: user.workplace,
      priority: user.priority
    }, transaction,
  })

  if (!isCreated) {
    const timeDiff = Math.abs((new Date).getTime() - (changeRole.updatedAt).getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (diffDays < 31) {
      return error(Errors.Forbidden, "Difference in days does not meet requirements", {
        daysAgo: diffDays
      });
    }
    await changeRole.update({
      adminId: '4ba343e5-1111-1111-1111-ae396a5ecc3d',//r.auth.credentials.id,  TODO add this params
      role: user.role,
      additionalInfo: user.additionalInfo,
      wagePerHour: user.wagePerHour,
      workplace: user.workplace,
      priority: user.priority
    }, {transaction})
  }

  await userController.setRole(r.payload.role, transaction)

  // TODO need add jobs RatingStatistik

  await transaction.commit();

  return output({
    adminId: changeRole.adminId,
    userId: changeRole.userId,
    role: changeRole.role,
    additionalInfo: changeRole.additionalInfo
  });
}

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
