import { GroupChatValidator } from './GroupChatValidator';
import { HandlerDecoratorBase, IHandler } from '../../types';
import { Chat } from '@workquest/database-models/lib/models';

export interface GetGroupChatCommand {
  readonly chatId: string;
}

export class GetGroupChatHandler implements IHandler<GetGroupChatCommand, Promise<Chat>> {
  public async Handle(command: GetGroupChatCommand): Promise<Chat> {
   return await Chat.scope('groupChat').findByPk(command.chatId);
  }
}

export class GetGroupChatPostValidationHandler extends HandlerDecoratorBase<GetGroupChatCommand, Promise<Chat>> {

  private readonly validator: GroupChatValidator;

  constructor(
    protected readonly decorated: IHandler<GetGroupChatCommand, Promise<Chat>>,
  ) {
    super(decorated);

    this.validator = new GroupChatValidator();
  }

  public async Handle(command: GetGroupChatCommand): Promise<Chat> {
    const chat = await this.decorated.Handle(command);

    this.validator.NotNull(chat, command.chatId);
    this.validator.GroupChatValidate(chat);

    return chat;
  }
}
