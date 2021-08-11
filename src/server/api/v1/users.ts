import {User} from "@workquest/database-models/lib/models";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";

export async function getUserInfo(r) {
  const user = await User.findByPk(r.params.questId)
  if(!user) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  return output(user);
}
