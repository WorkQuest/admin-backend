import {DisputeStatus} from "@workquest/database-models/lib/models";
import {DecideQuestDisputeCommand, DecideQuestDisputeResult} from "./types";
import {QuestDisputeAccessPermission} from "./QuestDisputeAccessPermission";
import {BaseDomainHandler, HandlerDecoratorBase, IHandler} from "../../types";

export class DecideQuestDisputeHandler extends BaseDomainHandler<DecideQuestDisputeCommand, DecideQuestDisputeResult> {
  public async Handle(command: DecideQuestDisputeCommand): DecideQuestDisputeResult {
    await command.dispute.update({
      decision: command.decision,
      status: DisputeStatus.PendingClosed,
      decisionDescription: command.decisionDescription,
    }, { transaction: this.options.tx });
  }
}

export class DecideQuestDisputePreAccessPermissionHandler extends HandlerDecoratorBase<DecideQuestDisputeCommand, DecideQuestDisputeResult> {

  private accessPermission: QuestDisputeAccessPermission;

  constructor(
    protected decorated: IHandler<DecideQuestDisputeCommand, DecideQuestDisputeResult>,
  ) {
    super(decorated);

    this.accessPermission = new QuestDisputeAccessPermission();
  }

  public async Handle(command: DecideQuestDisputeCommand): DecideQuestDisputeResult {
    this.accessPermission.HasStatus(command.dispute, DisputeStatus.InProgress);
    this.accessPermission.HasAssignedAdmin(command.dispute, command.disputeAdmin);

    return this.decorated.Handle(command);
  }
}
