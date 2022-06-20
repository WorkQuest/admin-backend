import {
  Chat,
  ChatMember,
  ChatMemberDeletionData, MemberStatus,
  ReasonForRemovingFromChat,
  Admin
} from "@workquest/database-models/lib/models";
import { error } from "../../../utils";
import { Errors } from "../../../utils/errors";

export class GroupChatAccessPermission {
  public MemberHasAccess(groupChat: Chat, member: ChatMember) {
    if (member.chatId !== groupChat.id) {
      throw error(Errors.Forbidden, 'Admin is not a member of this chat', {
        chatId: groupChat.id,
        adminId: member.adminId,
      });
    }
  }

  public MemberHasOwnerAccess(groupChat: Chat, member: ChatMember) {
    if (groupChat.groupChat.ownerMemberId !== member.id) {
      throw error(Errors.Forbidden, 'Admin must be owner of this chat', {
        chatId: groupChat.id,
        adminId: member.adminId,
      });
    }
  }

  public async AdminIsNotMemberAccess(groupChat: Chat, admins: Admin[]) {
    const adminIds = admins.map(admin => { return admin.id });

    const activeMembers = await ChatMember.findAll({
      where: {
        chatId: groupChat.id,
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
        chatId: groupChat.id,
        adminIds: existingAdminIds
      });
    }
  }

  public async AdminIsNotLeftAccess(groupChat: Chat, admins: Admin[]) {
    const adminIds = admins.map(admin => { return admin.id });

    const leveChatMembers = await ChatMemberDeletionData.findAll({
      where: {
        reason: ReasonForRemovingFromChat.Left,
      },
      include: [{
        model: ChatMember,
        as: 'chatMember',
        where: {
          chatId: groupChat.id,
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
        chatId: groupChat.id,
        adminIds: leftAdminIds
      });
    }
  }


}
