import { HandlerDecoratorBase, IHandler } from "../types";
import { Chat } from "@workquest/database-models/lib/models";
import { GetChatByIdValidator } from "./GetChatByIdValidator";

export interface GetChatByIdCommand {
  readonly chatId: string;
}

export class GetChatByIdHandler implements IHandler<GetChatByIdCommand, Promise<Chat>> {
  public Handle(command: GetChatByIdCommand): Promise<Chat> {
    return Chat.scope('forGetChat').findByPk(command.chatId);
  }
}

export class GetChatByIdPostValidationHandler<Tin extends { chatId: string }> extends HandlerDecoratorBase<Tin, Promise<Chat>> {
  private readonly validator: GetChatByIdValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<Chat>>,
  ) {
    super(decorated);

    this.validator = new GetChatByIdValidator();
  }

  public async Handle(command: Tin): Promise<Chat> {
    const chat = await this.decorated.Handle(command);

    this.validator.NotNull(chat, command.chatId);

    return chat;
  }
}
