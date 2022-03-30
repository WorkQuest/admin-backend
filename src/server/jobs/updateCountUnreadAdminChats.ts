import { addJob } from '../utils/scheduler';
import {ChatMember, ChatMemberData, AdminChatStatistic, MemberType} from "@workquest/database-models/lib/models";
import { Op } from 'sequelize';

export type UserUnreadChatsPayload = {
  adminIds: string[];
};

export async function updateCountUnreadAdminChatsJob(payload: UserUnreadChatsPayload) {
  return addJob('updateCountUnreadAdminChats', payload);
}

export default async function updateCountUnreadAdminChats(payload: UserUnreadChatsPayload) {
  for (const adminId of payload.adminIds) {
    const unreadChatsCounter = await ChatMember.unscoped().findAndCountAll({
      where: {
        adminId: adminId,
      },
      include: [{
        model: ChatMemberData,
        as: 'chatMemberData',
        where: { unreadCountMessages: { [Op.ne]: 0 } }
      }]
    });

    const [chatsStatistic, isCreated] = await AdminChatStatistic.findOrCreate({
      where: { adminId },
      defaults: { adminId, type: MemberType.Admin, unreadCountChats: unreadChatsCounter.count },
    });

    if (!isCreated) {
      await chatsStatistic.update({ unreadCountChats: unreadChatsCounter.count });
    }
  }
}
