import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {Admin, User, UserBlackList, UserBlackListStatus, UserStatus,} from "@workquest/database-models/lib/models";

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
  });

  return output({ count: count, users: rows });
}

export async function changeUserRole(r) {
  throw new Error('Not implemented');

/*  const user = await User.findByPk(r.params.userId)

  if(!user) {
    return error(Errors.NotFound, 'User is not found', {})
  }

  if(!user.changeRoleAt){
    await user.update({
      role: r.payload.role,
      changeRoleAt: Date.now(),
    });

    return output();
  }

  //can change role once per month
  const month = 31;

  let date = new Date();
  date.setDate(user.changeRoleAt.getDate() + month);
  const canChangeRole = date <= user.changeRoleAt

  if(!canChangeRole){
    return error(Errors.InvalidDate, 'User can change role once in 31 days', {})
  }
  await user.update({
    role: r.payload.role,
    changeRoleAt: Date.now(),
  });*/

  // return output();
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
    return error(Errors.NotFound, 'User is not blocked', {});
  }

  const userBlackList = await UserBlackList.findOne({
    where: { userId: user.id }, order: [['createdAt', 'DESC']],
  });

  if (userBlackList.status !== UserBlackListStatus.Blocked) {
    throw error(Errors.InvalidStatus, 'Internal error ', { userBlackList });
  }

  await user.update({ status: userBlackList.userStatusBeforeBlocking });

  await userBlackList.update({
    status: UserBlackListStatus.Unblocked,
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
  });

  return output({ count: count, users: rows });
}
