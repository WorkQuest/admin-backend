import { User } from '@workquest/database-models/lib/models';
import { error } from "../../utils";
import { Errors } from "../../utils/errors";

export class UserValidator {
  public NotNull(user: User, userId: string) {
    if (!user) {
      throw error(Errors.NotFound, 'User is not found', {
        userId,
      });
    }
  }
  public HasCompleteSetValidate(users: User[], userIds: string[]) {
    if (users.length !== userIds.length) {
      const userFindingIds = users.map(user => { return user.id });
      const notFoundUserIds = userIds.filter(userId => !userFindingIds.includes(userId));
      throw error(Errors.NotFound, 'Users not found', { userIds: notFoundUserIds });
    }
  }
}
