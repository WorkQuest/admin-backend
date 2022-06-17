import {BaseDomainHandler, HandlerDecoratorBase, IHandler} from "../types";
import { TakeQuestDisputeCommand, TakeQuestDisputeResult } from "../quest/dispute/types";
import { AdminRole, DisputeStatus } from "@workquest/database-models/lib/models";
import { AdminAccessPermission } from "./AdminAccessPermission";

export interface ChangeAdminRoleCommand {
  readonly adminId: string;
  readonly role: AdminRole;
}

export interface ChangeAdminRolePayload()

export class ChangeAdminRoleHandler extends BaseDomainHandler<TakeQuestDisputeCommand, TakeQuestDisputeResult> {

  private static async changeAdminRole(ChangeAdminRoleCommand)


  public async Handle(command: ChangeAdminRoleCommand): TakeQuestDisputeResult {

  }
}

export class ChangeAdminRolePreAccessHandler extends HandlerDecoratorBase<TakeQuestDisputeCommand, TakeQuestDisputeResult> {

  private accessPermission: AdminAccessPermission;

  constructor(
    protected readonly decorated: IHandler<TakeQuestDisputeCommand, TakeQuestDisputeResult>
  ) {
    super(decorated);

    this.accessPermission = new AdminAccessPermission();
  }

  public async Handle(command: TakeQuestDisputeCommand): TakeQuestDisputeResult {
    return this.decorated.Handle(command);
  }
}
