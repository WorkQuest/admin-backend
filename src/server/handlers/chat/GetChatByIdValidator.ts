import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Chat } from "@workquest/database-models/lib/models";

export class GetChatByIdValidator {
  public NotNull(chat: Chat, chatId: string) {
    if (!chat) {
      throw error(Errors.NotFound, 'Chat is not found', {
        chatId,
      });
    }
  }
}

