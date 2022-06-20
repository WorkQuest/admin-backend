import { Admin, DisputeStatus, QuestDispute } from "@workquest/database-models/lib/models";
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
  public async HasNoActiveDisputes(changedRoleAdminId: string) {
    const dispute = await QuestDispute.findOne({ where: { assignedAdminId: changedRoleAdminId, status: DisputeStatus.InProgress } });

    if (dispute) {
      throw error(Errors.Forbidden, 'Admin has active disputes', {
        adminId: changedRoleAdminId,
        disputeId: dispute.id,
      });
    }
  }
}
