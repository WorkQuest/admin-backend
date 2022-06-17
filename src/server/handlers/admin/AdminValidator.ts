import { Admin, AdminRole } from '@workquest/database-models/lib/models';
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
      const adminFindingIds = admins.map(admin => { return admin.id });
      const notFoundAdminIds = adminIds.filter(adminId => !adminFindingIds.includes(adminId));
      throw error(Errors.NotFound, 'Admins not found', { adminIds: notFoundAdminIds });
    }
  }
  public DontChangeRoleToMe(mainAdmin: Admin, changeRoleAdminId: string) {
    if (mainAdmin.id === changeRoleAdminId) {
      throw error(Errors.Forbidden, 'You can not change your role', { adminId: changeRoleAdminId });
    }
  }
  public NotMailRole(role: AdminRole) {
    if (role === AdminRole.Main) {
      throw error(Errors.Forbidden, 'Can not change admin role to Main', {});
    }
  }
}
