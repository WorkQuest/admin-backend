import { addJob } from '../utils/scheduler';
import { ChatMemberData } from '@workquest/database-models/lib/models';
import { literal, Op } from "sequelize";

export type UnreadMessageIncrementPayload = {
  chatId: string;
  notifierMemberId?: string;
};

export async function incrementUnreadCountMessageOfAdminMembersJob(payload: UnreadMessageIncrementPayload) {
  return addJob('incrementUnreadCountMessageOfAdminMembers', payload);
}

export default async function incrementUnreadCountMessageOfAdminMembers(payload: UnreadMessageIncrementPayload) {
  const chatMemberIncrementLiteral = literal(
    `(1 = (CASE WHEN EXISTS (SELECT "chatId" FROM "ChatMemberData" INNER JOIN "ChatMembers" ON "ChatMemberData"."chatMemberId" = "ChatMembers"."id" WHERE "ChatMembers"."chatId" = '${payload.chatId}') THEN 1 ELSE 0 END))`
  );
  await ChatMemberData.increment('unreadCountMessages', {
    where: {
      ...(payload.notifierMemberId && { chatMemberId: { [Op.ne]: payload.notifierMemberId } }),
      chatMemberIncrementLiteral
    }
  });
}
