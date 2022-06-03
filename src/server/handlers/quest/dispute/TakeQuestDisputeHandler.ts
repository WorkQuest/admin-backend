import {BaseDomainHandler} from "../../types";
import {QuestDispute, DisputeStatus, Admin} from "@workquest/database-models/lib/models";

export interface TakeQuestDisputeCommand {
  readonly disputeAdmin: Admin;
  readonly dispute: QuestDispute;
}

export class TakeQuestDisputeHandler extends BaseDomainHandler<TakeQuestDisputeCommand, Promise<void>> {
  public async Handle(command: TakeQuestDisputeCommand): Promise<void> {
    await command.dispute.update({
      acceptedAt: Date.now(),
      status: DisputeStatus.InProgress,
      assignedAdminId: command.disputeAdmin.id,
    }, { transaction: this.options.tx });
  }
}
