import { addJob } from "../utils/scheduler";

export type UpdateChatDataPayload = {
  chatId: string;
  lastMessageId: string;
};

export async function updateChatDataJob(payload: UpdateChatDataPayload) {
  return addJob('updateChatData', payload);
}






