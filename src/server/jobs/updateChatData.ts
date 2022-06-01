import { addJob } from "../utils/scheduler";

export type UpdateCountUnreadChatsPayload = {
  chatId: string;
  lastMessageId: string;
};

export async function updateChatDataJob(payload: UpdateCountUnreadChatsPayload) {
  return addJob('updateChatData', payload);
}






