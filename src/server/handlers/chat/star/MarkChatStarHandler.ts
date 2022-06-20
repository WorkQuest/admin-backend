import { IHandler } from '../../types';
import { StarredChat, Admin, Chat } from '@workquest/database-models/lib/models';

export interface MarkChatStarCommand {
  readonly admin: Admin;
  readonly chat: Chat;
}

export class MarkChatStarHandler implements IHandler<MarkChatStarCommand, Promise<void>> {
  public async Handle(command: MarkChatStarCommand): Promise<void> {
    await StarredChat.findOrCreate({
      where: {
        chatId: command.chat.id,
        adminId: command.admin.id,
      },
      defaults: {
        chatId: command.chat.id,
        adminId: command.admin.id,
      }
    });
  }
}
