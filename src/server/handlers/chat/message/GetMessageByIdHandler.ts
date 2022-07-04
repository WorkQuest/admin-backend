import { MessageValidator } from './MessageValidator';
import { HandlerDecoratorBase, IHandler } from '../../types';
import { Chat, Message } from '@workquest/database-models/lib/models';

export interface GetMessageByIdCommand {
  readonly messageId: string;
}

export interface GetChatMessageByIdCommand {
  readonly chat: Chat;
  readonly messageId: string;
}

export class GetMessageByIdHandler implements IHandler<GetMessageByIdCommand, Promise<Message>> {
  public Handle(command: GetMessageByIdCommand): Promise<Message> {
    return Message.findByPk(command.messageId);
  }
}

export class GetChatMessageByIdHandler implements IHandler<GetChatMessageByIdCommand, Promise<Message>> {
  public Handle(command: GetChatMessageByIdCommand): Promise<Message> {
    return Message.findOne({ where: { id: command.messageId, chatId: command.chat.id } });
  }
}

export class GetMessageByIdPostValidatorHandler extends HandlerDecoratorBase<GetMessageByIdCommand, Promise<Message>> {
  private readonly messageValidator: MessageValidator;

  constructor(
    protected readonly decorated: IHandler<GetMessageByIdCommand, Promise<Message>>,
  ) {
    super(decorated);
  }

  public async Handle(command: GetMessageByIdCommand): Promise<Message> {
    const message = await this.decorated.Handle(command);

    this.messageValidator.NotNull(message, command.messageId);

    return message;
  }
}

export class GetChatMessageByIdPostValidatorHandler extends HandlerDecoratorBase<GetChatMessageByIdCommand, Promise<Message>> {
  private readonly messageValidator: MessageValidator;

  constructor(
    protected readonly decorated: IHandler<GetChatMessageByIdCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.messageValidator = new MessageValidator();
  }

  public async Handle(command: GetChatMessageByIdCommand): Promise<Message> {
    const message = await this.decorated.Handle(command);

    this.messageValidator.NotNullThisChat(message, command.chat, command.messageId);

    return message;
  }
}
