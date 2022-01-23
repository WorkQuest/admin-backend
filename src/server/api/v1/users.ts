import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";
import {User} from "@workquest/database-models/lib/models";

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

export async function blockUser(r) {
  throw new Error('Not implemented');
}

export async function unblockUser(r) {
  throw new Error('Not implemented');
}

export async function getUserBlockingHistory(r) {
  throw new Error('Not implemented');
}
