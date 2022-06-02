import { addJob } from "../utils/scheduler";

export interface MessageAsReadPayload {
  chatId: string;
  senderMemberId: string;
  lastUnreadMessage: { id: string; number: number };
}


export async function setMessageAsReadJob(payload: MessageAsReadPayload) {
  return addJob('setMessageAsRead', payload);
}






