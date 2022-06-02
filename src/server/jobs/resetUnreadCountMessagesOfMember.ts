import { addJob } from "../utils/scheduler";

export type ResetUnreadCountMessagesPayload = {
  chatId: string,
  memberId: string,
  lastReadMessage: { id: string, number: number },
};


export async function resetUnreadCountMessagesOfMemberJob(payload: ResetUnreadCountMessagesPayload) {
  return addJob('resetUnreadCountMessagesOfMember', payload);
}






