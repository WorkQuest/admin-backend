import {BaseDomainHandler, HandlerDecoratorBase, IHandler} from "../types";
import { AdminAccessPermission } from "./AdminAccessPermission";
import { ChangeAdminRoleCommand, ChangeAdminRoleResult } from "./types";
import { AdminChangeRoleData } from "@workquest/database-models/lib/models/admin/AdminChangeRoleData";
import { AdminValidator } from "./AdminValidator";

export interface ChangeAdminRolePayload extends ChangeAdminRoleCommand {

}

export class ChangeAdminRoleHandler extends BaseDomainHandler<ChangeAdminRoleCommand, ChangeAdminRoleResult> {
  public async Handle(command: ChangeAdminRoleCommand): ChangeAdminRoleResult {
    await AdminChangeRoleData.create({
      changedByAdminId: command.changeRoleByAdmin.id,
      adminId: command.changeRoleAdmin.id,
      movedFromRole: command.changeRoleAdmin.role,
    }, { transaction: this.options.tx });

    await command.changeRoleAdmin.update({
      role: command.moveToRole,
    }, { transaction: this.options.tx });
  }
}

export class ChangeAdminRolePreValidateHandler extends HandlerDecoratorBase<ChangeAdminRoleCommand, ChangeAdminRoleResult> {

  private readonly validator: AdminValidator;

  constructor(
    protected readonly decorated: IHandler<ChangeAdminRoleCommand, ChangeAdminRoleResult>,
  ) {
    super(decorated);

    this.validator = new AdminValidator();
  }

  public async Handle(command: ChangeAdminRoleCommand): ChangeAdminRoleResult {
    this.validator.NotMailRole(command.moveToRole);
    this.validator.CantChangeSelfRole(command.changeRoleByAdmin.id,command.changeRoleAdmin.id);

    return this.decorated.Handle(command);
  }
}

export class ChangeAdminRolePreAccessPermissionHandler extends HandlerDecoratorBase<ChangeAdminRoleCommand, ChangeAdminRoleResult> {

  private accessPermission: AdminAccessPermission;

  constructor(
    protected readonly decorated: IHandler<ChangeAdminRoleCommand, ChangeAdminRoleResult>
  ) {
    super(decorated);

    this.accessPermission = new AdminAccessPermission();
  }

  public async Handle(command: ChangeAdminRoleCommand): ChangeAdminRoleResult {
    await this.accessPermission.HasNoActiveDisputes(command.changeRoleAdmin.id);
    return this.decorated.Handle(command);
  }
}
