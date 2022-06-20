import {error} from "../../../utils";
import {Errors} from "../../../utils/errors";
import {QuestDispute, DisputeStatus, Admin} from "@workquest/database-models/lib/models";

export class QuestDisputeAccessPermission {
  public HasStatus(questDispute: QuestDispute, status: DisputeStatus) {
    if (questDispute.status !== status) {
      throw error(Errors.InvalidStatus, 'Quest dispute does not match status', {
        mustHave: status,
        current: questDispute.status,
      });
    }
  }
  public HasAssignedAdmin(questDispute: QuestDispute, admin: Admin) {
    if (questDispute.assignedAdminId !== admin.id) {
      throw error(Errors.Forbidden, 'Admin are not an assigned on this dispute', {});
    }
  }
}
