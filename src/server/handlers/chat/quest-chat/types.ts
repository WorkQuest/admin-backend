import {
  Chat,
  Admin,
  Message,
  ChatMember,
  InfoMessage,
} from "@workquest/database-models/lib/models";

/** Commands */

export interface AddDisputeAdminInQuestChatCommand {
  readonly questChat: Chat;
  readonly admin: Admin;
}

export interface LeaveFromQuestChatCommand {
  readonly member: ChatMember;
  readonly questChat: Chat;
}

/** Results */

export type AddDisputeAdminInQuestChatResult = Promise<[
  ChatMember,
  [Message, InfoMessage],
]>;

export type LeaveFromQuestChatResult = Promise<[
  Message,
  InfoMessage,
]>;
