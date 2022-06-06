import { IHandler, HandlerDecoratorBase, BaseDomainHandler } from "../../types";
import { Chat, Quest, QuestChat, QuestChatStatus } from "@workquest/database-models/lib/models";
import { GetChatByIdValidator } from "../GetChatByIdValidator";

export interface GetQuestChatByIdCommand {
  readonly questId: string;
}

export class GetQuestChatByIdHandler extends BaseDomainHandler<GetQuestChatByIdCommand, Promise<[Chat, QuestChat]>> {
  public async Handle(command: GetQuestChatByIdCommand): Promise<[Chat, QuestChat]> {
    const questChat = await QuestChat.findOne({
      where: {
        questId: command.questId,
        status: QuestChatStatus.Open,
      },
      include: [{
        model: Chat,
        as: 'chat',
      }, {
        model: Quest,
        as: 'quest',
      },]
    });

    return [questChat.chat, questChat];
  }
}

export class GetQuestChatByIdPostValidationHandler<Tin extends { chatId: string }> extends HandlerDecoratorBase<Tin, Promise<Chat>> {
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
