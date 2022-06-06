import { error } from "../../../utils";
import { Errors } from "../../../utils/errors"
import {
  Chat,
  ChatType,
  ChatMember,
} from "@workquest/database-models/lib/models";

export class GroupChatValidator {
  public NotNull(groupChat: Chat, chatId: string) {
    if (!groupChat) {
      throw error(Errors.NotFound, 'Chat does not exist', { chatId });
    }
  }
  public GroupChatValidate(groupChat: Chat) {
    if (groupChat.type !== ChatType.Group) {
      throw error(Errors.InvalidType, "Chat type must be group", {
        chatId: groupChat.id,
        currentType: groupChat.type,
      });
    }
  }
  public NotChatOwnerValidate(groupChat: Chat, member: ChatMember) {
    if (member.id === groupChat.groupChat.ownerMemberId) {
      throw error(Errors.Forbidden, 'Admin is an owner of this chat', {
        chatId: groupChat.id,
        ownerId: member.id
      });
    }
  }
}
