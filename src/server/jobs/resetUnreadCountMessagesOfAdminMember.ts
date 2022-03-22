import { addJob } from '../utils/scheduler';
import { ChatMemberData } from '@workquest/database-models/lib/models';

export type resetUnreadCountMessagesPayload = {
  chatId: string;
  memberId: string;
  lastReadMessageId: string;
  lastReadMessageNumber: number;
};

export async function resetUnreadCountMessagesOfAdminMemberJob(payload: resetUnreadCountMessagesPayload) {
  return addJob('resetUnreadCountMessagesOfAdminMember', payload);
}

export default async function resetUnreadCountMessagesOfAdminMember(payload: resetUnreadCountMessagesPayload) {
  await ChatMemberData.update(
    {
      unreadCountMessages: 0,
      lastReadMessageId: payload.lastReadMessageId,
      lastReadMessageNumber: payload.lastReadMessageNumber,
    },
    {
      where: { chatMemberId: payload.memberId },
    },
  );
}
