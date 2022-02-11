import { User, UserSpecializationFilter } from "@workquest/database-models/lib/models";
import { addJob } from "../utils/scheduler";

export interface DeleteUserFiltersPayload {
  userId: string;
}

export async function deleteUserFiltersJob(payload: DeleteUserFiltersPayload) {
  return addJob("deleteUserFilters", payload);
}

export default async function (payload: DeleteUserFiltersPayload) {
  const user = await User.findByPk(payload.userId);

  if (!user) {
    return true;
  }

  await UserSpecializationFilter.destroy({
    where: { userId: user.id }
  });
}
