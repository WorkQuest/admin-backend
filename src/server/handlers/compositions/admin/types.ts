import {
  Chat,
  Admin,
  Message,
  ChatMember,
  InfoMessage,
  QuestDispute,
  DisputeDecision, AdminRole,
} from "@workquest/database-models/lib/models";

/** Commands */

export interface ChangeAdminRoleComposCommand {
  readonly meAdmin: Admin;
  readonly changeRoleAdminId: string;
  readonly moveToRole: AdminRole;
}

/** Results */

export type ChangeAdminRoleComposResults = Promise<void>;


