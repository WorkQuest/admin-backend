import { addJob } from "../utils/scheduler";

export type UnreadMessageIncrementPayload = {
  readonly chatId: string;
  readonly skipMemberIds: string[];
}

export async function incrementUnreadCountMessageOfMembersJob(payload: UnreadMessageIncrementPayload) {
  return addJob('incrementUnreadCountMessageOfMembers', payload);
}






