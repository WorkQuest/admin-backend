import { IHandler } from '../../types';
import { StarredMessage, Admin, Message } from '@workquest/database-models/lib/models';

export class RemoveStarFromMessageCommand {
  readonly admin: Admin;
  readonly messageId: string;
}

export class RemoveStarFromMessageHandler implements IHandler<RemoveStarFromMessageCommand, Promise<void>>{
  public async Handle(command: RemoveStarFromMessageCommand): Promise<void> {
    await StarredMessage.destroy({
      where: {
        adminId: command.admin.id,
        messageId: command.messageId,
      },
    });
  }
}
