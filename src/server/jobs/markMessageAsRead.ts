import { addJob } from '../utils/scheduler';
import { ChatMember, Message, SenderMessageStatus } from '@workquest/database-models/lib/models';
import { Op } from 'sequelize';

export interface MessageAsReadPayload {
  lastUnreadMessage: { id: string; number: number };
  chatId: string;
  senderMemberId: string;
}

export async function markMessageAsReadJob(payload: MessageAsReadPayload) {
  return addJob('markMessageAsRead', payload);
}

export default async function markMessageAsRead(payload: MessageAsReadPayload) {
  await Message.update(
    {
      senderStatus: SenderMessageStatus.read,
    },
    {
      where: {
        chatId: payload.chatId,
        senderStatus: SenderMessageStatus.unread,
        senderMemberId: { [Op.ne]: payload.senderMemberId },
        number: { [Op.lte]: payload.lastUnreadMessage.number },
      },
    },
  );
}
