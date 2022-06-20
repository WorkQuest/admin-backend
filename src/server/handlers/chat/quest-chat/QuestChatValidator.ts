import { error } from "../../../utils";
import { Errors } from "../../../utils/errors"
import {
  Chat,
  ChatType,
  ChatMember,
} from "@workquest/database-models/lib/models";

export class QuestChatValidator {
  public NotNull(questChat: Chat, chatId: string) {
    if (!questChat) {
      throw error(Errors.NotFound, 'Chat does not exist', { chatId });
    }
  }
  public QuestChatValidate(questChat: Chat) {
    if (questChat.type !== ChatType.Quest) {
      throw error(Errors.InvalidType, "Chat type must be quest", {
        chatId: questChat.id,
        currentType: questChat.type,
      });
    }
  }
}
