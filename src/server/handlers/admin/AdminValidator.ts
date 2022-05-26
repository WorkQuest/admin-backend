import { Admin } from '@workquest/database-models/lib/models';
import { error } from "../../utils";
import { Errors } from "../../utils/errors";

export class AdminValidator {
  public NotNull(admin: Admin, adminId: string) {
    if (!admin) {
      throw error(Errors.NotFound, 'Admin is not found', {
        adminId,
      });
    }
  }
  public HasCompleteSetValidate(admins: Admin[], adminIds: string[]) {
    if (admins.length !== adminIds.length) {
      const notFountAdminIds = admins.map(admin => {
        if (!adminIds.includes(admin.id)) {
          return admin.id
        }
      });
      throw error(Errors.NotFound, 'Admins not found', { adminIds: notFountAdminIds });
    }
  }
}
