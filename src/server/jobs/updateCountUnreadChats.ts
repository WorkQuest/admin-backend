import { addJob } from "../utils/scheduler";
import { ChatMember } from "@workquest/database-models/lib/models";

export type UpdateCountUnreadChatsPayload = {
  readonly members: ChatMember[];
};

export async function updateCountUnreadChatsJob(payload: UpdateCountUnreadChatsPayload) {
  return addJob('updateCountUnreadChats', payload);
}






