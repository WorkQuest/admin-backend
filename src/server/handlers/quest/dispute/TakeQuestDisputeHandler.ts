import {DisputeStatus} from "@workquest/database-models/lib/models";
import {TakeQuestDisputeResult, TakeQuestDisputeCommand} from "./types";
import {QuestDisputeAccessPermission} from "./QuestDisputeAccessPermission";
import {BaseDomainHandler, HandlerDecoratorBase, IHandler} from "../../types";

export class TakeQuestDisputeHandler extends BaseDomainHandler<TakeQuestDisputeCommand, TakeQuestDisputeResult> {
  public async Handle(command: TakeQuestDisputeCommand): TakeQuestDisputeResult {
    await command.dispute.update({
      acceptedAt: Date.now(),
      status: DisputeStatus.InProgress,
      assignedAdminId: command.disputeAdmin.id,
    }, { transaction: this.options.tx });
  }
}

export class TakeQuestDisputePreAccessPermissionHandler extends HandlerDecoratorBase<TakeQuestDisputeCommand, TakeQuestDisputeResult> {

  private accessPermission: QuestDisputeAccessPermission;

  constructor(
    protected readonly decorated: IHandler<TakeQuestDisputeCommand, TakeQuestDisputeResult>
  ) {
    super(decorated);

    this.accessPermission = new QuestDisputeAccessPermission();
  }

  public async Handle(command: TakeQuestDisputeCommand): TakeQuestDisputeResult {
    this.accessPermission.HasStatus(command.dispute, DisputeStatus.Created);

    return this.decorated.Handle(command);
  }
}
