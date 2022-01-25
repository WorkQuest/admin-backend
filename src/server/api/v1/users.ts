import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {
  User,
  UserStatus,
  UserBlackList,
  BlackListStatus,
} from "@workquest/database-models/lib/models";
import {Op} from "sequelize";

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
    return error(Errors.NotFound, 'User is not found', {userId: r.params.userId});
  }

  await UserBlackList.findOrCreate({
    where: {
      userId: user.id,
      status: BlackListStatus.Blocked,
    },
    defaults: {
      userId: user.id,
      adminId: r.auth.credentials.id,
      reason: r.payload.blockReason,
      previousQuestStatus: user.status,
    }
  });

  await user.update({ status: UserStatus.Blocked});

  return output();
}

export async function unblockUser(r) {
  const blockedUser = await UserBlackList.findOne({
    where: {
      [Op.and]: [{questId: r.params.userId}, {status: BlackListStatus.Blocked}]
    }
  });

  if(!blockedUser) {
    return error(Errors.NotFound, 'User is not found or not blocked', {});
  }

  await blockedUser.update({status: BlackListStatus.Unblocked});
  await User.update({status: blockedUser.previousUserStatus}, {where: {id: r.params.userId}});

  return output();
}

export async function getUserBlockingHistory(r) {
  throw new Error('Not implemented');
}
