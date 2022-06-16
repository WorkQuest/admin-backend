import { Chat, ChatMember, MemberStatus, MemberType } from '@workquest/database-models/lib/models';
import { error } from '../../../utils';
import { Errors } from '../../../utils/errors';

export class ChatMemberAccessPermission {
  public HasLimitedAccessOnChat(chat: Chat, member: ChatMember) {
    if (member.type === MemberType.Admin) {
      if (member.chatId !== chat.id) {
        throw error(Errors.Forbidden, 'Admin is not a member of this chat', {
          chatId: chat.id,
          adminId: member.adminId,
        });
      }
    }
    if (member.type === MemberType.Admin) {
      if (member.chatId !== chat.id) {
        throw error(Errors.Forbidden, 'Admin is not a member of this chat', {
          chatId: chat.id,
          adminId: member.adminId,
        });
      }
    }
  }
  public HasFullAccessOnChat(chat: Chat, member: ChatMember) {
    if (member.type === MemberType.Admin) {
      if (member.chatId !== chat.id) {
        throw error(Errors.Forbidden, 'Admin is not a member of this chat', {
          chatId: chat.id,
          adminId: member.adminId,
        });
      }
      if (member.status === MemberStatus.Deleted) {
        throw error(Errors.Forbidden, 'Admin has been deleted from this chat', {
          chatId: chat.id,
          adminId: member.adminId,
        });
      }
    }
    if (member.type === MemberType.User) {
      if (member.chatId !== chat.id) {
        throw error(Errors.Forbidden, 'User is not a member of this chat', {
          chatId: chat.id,
          userId: member.userId,
        });
      }
      if (member.status === MemberStatus.Deleted) {
        throw error(Errors.Forbidden, 'User has been deleted from this chat', {
          chatId: chat.id,
          userId: member.userId,
        });
      }
    }
  }
}
