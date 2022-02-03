import { addJob } from '../utils/scheduler';
import { ChatMember } from '@workquest/database-models/lib/models';

export type resetUnreadCountMessagesPayload = {
  chatId: string;
  userId: string;
  lastReadMessageId: string;
  lastReadMessageNumber: number;
};

export async function resetUnreadCountMessagesOfMemberJob(payload: resetUnreadCountMessagesPayload) {
  return addJob('resetUnreadCountMessagesOfMember', payload);
}

export default async function resetUnreadCountMessagesOfMember(payload: resetUnreadCountMessagesPayload) {
  await ChatMember.update(
    {
      unreadCountMessages: 0,
      lastReadMessageId: payload.lastReadMessageId,
      lastReadMessageNumber: payload.lastReadMessageNumber,
    },
    {
      where: { chatId: payload.chatId, userId: payload.userId },
    },
  );
}
