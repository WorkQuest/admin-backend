import { Admin } from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";

export class AdminAccessPermission {
  public AdminsAreActiveAccess(admins: Admin[]) {
    const inactiveAdmins = admins.filter(admin => {
      if (!admin.isActive) {
        return admin.id
      }
    });

    if (inactiveAdmins.length !== 0 ) {
      throw error(Errors.InactiveAdmin, 'Admins must be active', {
        adminIds: inactiveAdmins,
      });
    }
  }
  public AdminIsActiveAccess(admin: Admin) {
    if (!admin.isActive) {
      throw error(Errors.InactiveAdmin, 'Admin must be active', {
        adminId: admin.id,
      });
    }
  }
}
