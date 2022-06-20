import { Admin, AdminRole } from "@workquest/database-models/lib/models";

/** Commands */

export interface ChangeAdminRoleCommand {
  readonly changeRoleAdmin: Admin;
  readonly changeRoleByAdmin: Admin;

  readonly moveToRole: AdminRole;
}


/** Results */

export type ChangeAdminRoleResult = Promise<void>;
