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

  public async AdminIsNotMemberAccess(questChat: Chat, admin: Admin) {
    const activeMember = await ChatMember.findOne({
      where: {
        chatId: questChat.id,
        adminId: admin.id,
        status: MemberStatus.Active,
      }
    });

    if (activeMember) {
      throw error(Errors.AlreadyExists, "Admin already exists in the chat", {
        chatId: questChat.id,
        adminIds: admin.id
      });
    }
  }

  public async AdminIsNotLeftAccess(questChat: Chat, admins: Admin[]) {
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
