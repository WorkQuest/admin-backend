import {User, UserStatus} from "@workquest/database-models/lib/models";
import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import { Op } from "sequelize";

export async function getUserInfo(r) {
  const user = await User.findByPk(r.params.userId)
  if(!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  return output(user);
}

export async function getUsers(r) {
  const {rows, count} = await User.findAndCountAll({
    where: {
      status: {
        [Op.not]: UserStatus.isBlocked,
      }
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, users: rows });
}

export async function blockUser(r) {
  const user = await User.findByPk(r.params.userId)

  if(!user) {
    return error(Errors.NotFound, 'User is not found', {})
  }

  await user.update({
    status: UserStatus.isBlocked,
  });

  return output();
}

export async function blackListInfo(r) {
  const {rows, count} = await User.findAndCountAll({
    where: {
      status: UserStatus.isBlocked
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, users: rows });
}
