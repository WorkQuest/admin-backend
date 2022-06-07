import { addJob } from "../utils/scheduler";
import { ChatMember } from "@workquest/database-models/lib/models";

export type MemberUnreadMessagesPayload = {
  chatId: string;
  readerMemberId: string;
  lastUnreadMessage: { id: string; number: number };
};

export async function updateCountUnreadMessagesJob(payload: MemberUnreadMessagesPayload) {
  return addJob('updateCountUnreadMessages', payload);
}






