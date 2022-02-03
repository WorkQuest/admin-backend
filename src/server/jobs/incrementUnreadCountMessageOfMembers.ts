import { addJob } from '../utils/scheduler';
import { ChatMember } from '@workquest/database-models/lib/models';
import { Op } from 'sequelize';

export type UnreadMessageIncrementPayload = {
  chatId: string;
  notifierUserId?: string;
};

export async function incrementUnreadCountMessageOfMembersJob(payload: UnreadMessageIncrementPayload) {
  return addJob('incrementUnreadCountMessageOfMembers', payload);
}

export default async function incrementUnreadCountMessageOfMembers(payload: UnreadMessageIncrementPayload) {
  await ChatMember.increment('unreadCountMessages', {
    where: {
      ...(payload.notifierUserId && { userId: { [Op.ne]: payload.notifierUserId } }),
      chatId: payload.chatId,
    },
  });
}
