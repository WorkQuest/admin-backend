import {error, output} from "../../utils";
import {ChangeRole, Quest, QuestStatus, User, UserStatus} from "@workquest/database-models/lib/models";
import {Errors} from "../../utils/errors";
import {Session, User} from "@workquest/database-models/lib/models";
import {Op} from "sequelize";
import {UserBlockReason} from "@workquest/database-models/lib/models/user/UserBlockReason";
import {getDefaultAdditionalInfo} from "../../utils/common";

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
  const user = await User.findByPk(r.params.userId)

  if(quests.count !== 0) {
    return error(Errors.InvalidStatus, 'You can not change role while you have not closed quests', {quests: quests.rows});
  }

  const alreadyChangedRole = await ChangeRole.findOne({
    where: {
      userId: r.params.userId
    },
    order: [ ['createdAt', 'DESC'] ],
  });

  const transaction = await r.server.app.db.transaction();

  if(!alreadyChangedRole) {
    const user = await User.findByPk(r.params.userId);
    await ChangeRole.create({
      userId: user.id,
      previousAdditionalInfo: user.additionalInfo,
      previousRole: user.role,
      changeRoleAt: Date.now(),
    }, {transaction});

    await user.update({
      role: r.payload.role,
      additionalInfo: getDefaultAdditionalInfo(r.payload.role),
    }, {transaction});

    await transaction.commit();

    return output(user);
  }

  const user = await User.findByPk(r.params.userId);

  //can change role once per month
  const month = 1;

  let date = new Date(alreadyChangedRole.changeRoleAt);
  date.setMonth(date.getMonth() + month);
  let canChangeRole = date <= new Date()
  if(!canChangeRole){
    await transaction.rollback
    return error(Errors.InvalidDate, 'User can change role once per month', {})
  }

  await ChangeRole.create({
    userId: user.id,
    previousAdditionalInfo: user.additionalInfo,
    previousRole: user.role,
    changeRoleAt: Date.now(),
  }, {transaction});

  await user.update({
    role: alreadyChangedRole.previousRole,
    additionalInfo: alreadyChangedRole.previousAdditionalInfo,
  }, {transaction});

  await transaction.commit();

  return output(user);
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
