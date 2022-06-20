import { BaseCompositeHandler } from "../../types";
import { ChangeAdminRoleComposCommand, ChangeAdminRoleComposResults } from "./types";
import { GetAdminsByIdHandler, GetAdminsByIdPostValidationHandler } from "../../admin";
import {
  ChangeAdminRoleHandler,
  ChangeAdminRolePreAccessPermissionHandler,
  ChangeAdminRolePreValidateHandler
} from "../../admin/ChangeAdminRoleHandler";

export class ChangeAdminRoleComposHandler extends BaseCompositeHandler<ChangeAdminRoleComposCommand, ChangeAdminRoleComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: ChangeAdminRoleComposCommand): ChangeAdminRoleComposResults {
    const changeRoleAdmin = await new GetAdminsByIdPostValidationHandler(
      new GetAdminsByIdHandler()
    ).Handle({ adminId: command.changeRoleAdminId });

    await this.dbContext.transaction(async (tx) => {
      await new ChangeAdminRolePreValidateHandler(
        new ChangeAdminRolePreAccessPermissionHandler(
          new ChangeAdminRoleHandler().setOptions({ tx })
      )).Handle({ changeRoleAdmin, changeRoleByAdmin: command.meAdmin, moveToRole: command.moveToRole })
    });
  }
}
