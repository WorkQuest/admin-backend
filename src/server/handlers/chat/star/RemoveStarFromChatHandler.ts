import { IHandler } from '../../types';
import { StarredChat, Admin } from '@workquest/database-models/lib/models';

export interface RemoveStarFromChatCommand {
  readonly admin: Admin;
  readonly chatId: string;
}

export class RemoveStarFromChatHandler implements IHandler<RemoveStarFromChatCommand, Promise<void>> {
  public async Handle(command: RemoveStarFromChatCommand): Promise<void> {
    await StarredChat.destroy({
      where: {
        chatId: command.chatId,
        adminId: command.admin.id,
      },
    });
  }
}
