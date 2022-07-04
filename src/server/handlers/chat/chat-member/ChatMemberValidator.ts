import { Chat, ChatMember } from '@workquest/database-models/lib/models';
import { error } from "../../../utils";
import { Errors } from "../../../utils/errors";

export class ChatMemberValidator {
  public NotNull(chat: Chat, member: ChatMember) {
    if (!member) {
      throw error(Errors.NotFound, 'Member is not found', {
        chatId: chat.id,
      });
    }
  }
}
