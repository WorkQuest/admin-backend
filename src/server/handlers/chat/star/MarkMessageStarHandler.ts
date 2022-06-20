import { IHandler } from '../../types';
import { StarredMessage, Admin, Message } from '@workquest/database-models/lib/models';

export interface AdminMarkMessageStarCommand {
  readonly admin: Admin;
  readonly message: Message;
}

export class AdminMarkMessageStarHandler implements IHandler<AdminMarkMessageStarCommand, Promise<void>> {
  public async Handle(command: AdminMarkMessageStarCommand): Promise<void> {
    await StarredMessage.findOrCreate({
      where: {
        adminId: command.admin.id,
        messageId: command.message.id,
      },
      defaults: {
        adminId: command.admin.id,
        messageId: command.message.id,
      }
    });
  }
}
