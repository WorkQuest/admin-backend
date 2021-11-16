import {ChangeRole, User, UserStatus} from "@workquest/database-models/lib/models";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {Op} from "sequelize";
import {UserBlockReason} from "@workquest/database-models/lib/models/user/UserBlockReason";
import {getDefaultAdditionalInfo} from "../../utils/common";

export async function getUserInfo(r) {
  const user = await User.findByPk(r.params.userId, {
    include: [{
      model: UserBlockReason,
      as: 'blockReasons'
    }]
  });

  if(!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  return output(user);
}

//TODO обычная или не обычная активность
export async function getUsers(r) {
  const {rows, count} = await User.findAndCountAll({
    attributes: {exclude: ['password']},
    where: {
      status: {
        [Op.not]: UserStatus.Blocked, //TODO for op: NE or NOT?
      }
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count: count, users: rows });
}

//TODO: сделать смену дополнительной информации при смене роли (у воркера и эмплоера они разные)
export async function changeUserRole(r) {
  const alreadyChangedRole = await ChangeRole.findOne({
    where: {
      userId: r.params.userId
    },
    order: [ ['createdAt', 'DESC'] ]
  });

  if(!alreadyChangedRole) {
    const user = await User.findByPk(r.params.userId);
    await ChangeRole.create({
      userId: user.id,
      previousAdditionalInfo: user.additionalInfo,
      previousRole: user.role,
      changeRoleAt: Date.now(),
    });

    await user.update({
      role: r.payload.role,
      additionalInfo: getDefaultAdditionalInfo(r.payload.role),
    });

    return output(user);
  }

  const user = await User.findByPk(r.params.userId);

  //can change role once per month
  const month = 31;

  let date = new Date();
  date.setDate(alreadyChangedRole.changeRoleAt.getDate() + month);
  const canChangeRole = date <= alreadyChangedRole.changeRoleAt

  if(!canChangeRole){
    return error(Errors.InvalidDate, 'User can change role once in 31 days', {})
  }

  await user.update({
    role: r.payload.role,
    additionalInfo: getDefaultAdditionalInfo(r.payload.role),
  });

  return output(user);
}

export async function blockUser(r) {
  const user = await User.findByPk(r.params.userId)

  if(!user) {
    return error(Errors.NotFound, 'User is not found', {})
  }

  //Это нужно для того, чтобы статус не менялся по таблице UserBlockReason, иначе статус перезапишется на isBlocked навсегда
  if(user.status === UserStatus.Blocked) {
    return error(Errors.AlreadyBlocked, 'User is already blocked', {});
  }

  await UserBlockReason.create({
    userId: user.id,
    blockReason: r.payload.userBlockReasons,
    previousStatus: user.status,
  });

  await user.update({
    status: UserStatus.Blocked,
  });

  return output();
}

export async function unblockUser(r) {
  const user = await User.findByPk(r.params.userId)

  if(!user) {
    return error(Errors.NotFound, 'User is not found', {})
  }

  //Это нужно для того, чтобы статус не менялся по таблице UserBlockReason, иначе статус будет некорректный
  if(user.status !== UserStatus.Blocked) {
    return error(Errors.AlreadyUnblocked, 'User is already unblocked', {});
  }

  const wasBlocked = await UserBlockReason.findAndCountAll({
    where: {
      userId: user.id,
    },
    order:[ ['createdAt', 'DESC'] ], //the last status
  });

  const maxUnblockedCount = 3;

  if(wasBlocked.count === maxUnblockedCount) {
    return error(Errors.TooMuchBlocked, 'Unblock limit is expired', {});
  }

  await user.update({ status: wasBlocked.rows[0].previousStatus });

  return output();
}

export async function userBlockedStory(r) {
  const blockReasons = await UserBlockReason.findAndCountAll({
    where: {
      userId: r.params.userId,
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output(blockReasons);
}

export async function blackListInfo(r) {
  const {rows, count} = await User.scope('short').findAndCountAll({
    include: [{
      model: UserBlockReason,
      as: 'blockReasons',
      order: [ ['createdAt', 'DESC'] ],
      required: true,
    }],
    where: {
      status: UserStatus.Blocked,
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count: count, users: rows });
}
