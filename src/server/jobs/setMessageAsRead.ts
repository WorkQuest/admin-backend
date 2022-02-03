import { addJob } from '../utils/scheduler';
import { ChatMember, Message, SenderMessageStatus } from '@workquest/database-models/lib/models';
import { Op } from 'sequelize';

export interface MessageAsReadPayload {
  lastUnreadMessage: { id: string; number: number };
  chatId: string;
  senderId: string;
}

export async function setMessageAsReadJob(payload: MessageAsReadPayload) {
  return addJob('setMessageAsRead', payload);
}

export default async function setMessageAsRead(payload: MessageAsReadPayload) {
  await Message.update(
    {
      senderStatus: SenderMessageStatus.read,
    },
    {
      where: {
        chatId: payload.chatId,
        senderStatus: SenderMessageStatus.unread,
        senderUserId: { [Op.ne]: payload.senderId },
        number: { [Op.lte]: payload.lastUnreadMessage.number },
      },
    },
  );
}
