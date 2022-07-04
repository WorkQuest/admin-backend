import { User, UserStatus } from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";

export class UserAccessPermission {
  public UsersHasConfirmedAccess(users: User[]) {
    const unconfirmedUsers = users.filter(user => {
      if (user.status !== UserStatus.Confirmed) {
        return user.id
      }
    });

    if (unconfirmedUsers.length !== 0 ) {
      throw error(Errors.InvalidStatus, 'Users must have confirmed status', {
        userIds: unconfirmedUsers,
      });
    }
  }
  public UserHasConfirmedAccess(user: User) {
    if (user.status !== UserStatus.Confirmed) {
      throw error(Errors.InvalidStatus, 'Users must have confirmed status', {
        userId: user.id,
        currentStatus: user.status,
      });
    }
  }
}
