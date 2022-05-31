import { error } from "../../../utils";
import { Errors } from "../../../utils/errors";
import {
  Chat,
  ChatMember,
  ChatMemberDeletionData, MemberStatus,
  ReasonForRemovingFromChat,
  Admin
} from "@workquest/database-models/lib/models";

export class QuestChatAccessPermission {
  public MemberHasAccess(questChat: Chat, member: ChatMember) {
    if (member.chatId !== questChat.id) {
      throw error(Errors.Forbidden, 'Admin is not a member of this chat', {
        chatId: questChat.id,
        adminId: member.adminId,
      });
    }
  }

  public async AdminIsNotMemberAccess(questChat: Chat, admins: Admin[]) {
    const adminIds = admins.map(admin => { return admin.id });

    const activeMembers = await ChatMember.findAll({
      where: {
        chatId: questChat.id,
        adminId: adminIds,
        status: MemberStatus.Active,
      }
    });

    if (activeMembers.length !== 0) {
      const existingAdminIds = activeMembers.map(chatMember => {
        if (adminIds.includes(chatMember.adminId)) {
          return chatMember.adminId
        }
      });

      throw error(Errors.AlreadyExists, "Admins already exist in the chat", {
        chatId: questChat.id,
        adminIds: existingAdminIds
      });
    }
  }

  public async AdminIsNotLeftAccess(questChat: Chat, admins: Admin[]) {
    const adminIds = admins.map(admin => { return admin.id });

    const leveChatMembers = await ChatMemberDeletionData.findAll({
      where: {
        reason: ReasonForRemovingFromChat.Left,
      },
      include: [{
        model: ChatMember,
        as: 'chatMember',
        where: {
          chatId: questChat.id,
          adminId: adminIds
        }
      }]
    });

    if (leveChatMembers.length !== 0) {
      const leftAdminIds = leveChatMembers.map(chatMember => {
        if (adminIds.includes(chatMember.chatMember.adminId)) {
          return chatMember.chatMember.adminId
        }
      });

      throw error(Errors.AdminLeaveChat, "Can't add admin that left from the chat", {
        chatId: questChat.id,
        adminIds: leftAdminIds
      });
    }
  }


}
