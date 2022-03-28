import { Message } from '@workquest/database-models/lib/models';
import { error } from '../../utils';
import { Errors } from '../../utils/errors';

abstract class MessageHelper {
  public abstract message: Message;

  async messageMustBeSender(memberId: string) {
    if (this.message.senderMemberId !== memberId) {
      throw error(Errors.Forbidden, "User isn't sender of the message", {
        messageId: this.message.id,
      });
    }

    return this;
  }

  async messageMustBeChat(chatId: string) {
    if (this.message.chatId !== chatId) {
      throw error(Errors.Forbidden, 'This message not from this chat', {});
    }

    return this;
  }
}

export class MessageController extends MessageHelper {
  constructor(public message: Message) {
    super();

    if (!message) {
      throw error(Errors.NotFound, 'Message not found', {});
    }
  }
}
