import {Session, User, UserStatus} from "@workquest/database-models/lib/models";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import { Op } from "sequelize";
import {UserBlockReason} from "@workquest/database-models/lib/models/UserBlockReason";


export async function getUserInfo(r) {
  const user = await User.findByPk(r.params.userId)
  if(!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  return output(user);
}

//TODO обычная или не обычная активность
export async function getUsers(r) {
  const {rows, count} = await User.scope('withPassword').findAndCountAll({
    include: [{
      model: Session,
      as: 'lastSession',
    },],
    where: {
      status: {
        [Op.not]: UserStatus.Blocked,
      }
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, users: rows });
}

export async function changeUserRole(r) {
  const user = await User.findByPk(r.params.userId)

  if(!user) {
    return error(Errors.NotFound, 'User is not found', {})
  }

  let date = new Date();
  date.setDate(user.changeRoleAt.getDate() + 31);
  const canChangeRole = date <= user.changeRoleAt

  if(!canChangeRole){
    return error(Errors.InvalidDate, 'User can change role once in 31 days', {})
  }
  await user.update({
    role: r.payload.role,
    changeRoleAt: Date.now(),
  })

  return output();
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

  const wasBlocked = await UserBlockReason.findOne({
    where: {
      userId: user.id,
    }
  })

  if(wasBlocked) {
    await wasBlocked.update({
      blockReason: r.payload.userBlockReasons,
      previousStatus: user.status,
    })
    await user.update({
      status: UserStatus.Blocked,
    });

    return output();
  }

  await UserBlockReason.create({
    userId: user.id,
    blockReason: r.payload.userBlockReasons,
    previousStatus: user.status,
  })

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

  const wasBlocked = await UserBlockReason.findOne({
    where: {
      userId: user.id,
    }
  })

  await user.update({
    status: wasBlocked.previousStatus,
  });

  return output();
}

export async function blackListInfo(r) {
  const {rows, count} = await User.findAndCountAll({
    include: UserBlockReason,
    where: {
      status: UserStatus.Blocked
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, users: rows });
}