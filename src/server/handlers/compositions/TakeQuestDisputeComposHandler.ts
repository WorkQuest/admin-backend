import {BaseCompositeHandler} from "../types";
import { TakeQuestDisputeHandler } from "../quest/dispute/TakeQuestDisputeHandler";
import {Message, Admin, QuestChat, QuestDispute, Chat} from "@workquest/database-models/lib/models";
import {
  AddDisputeAdminInQuestChatHandler,
  AddDisputeAdminInQuestChatPreValidateHandler,
  AddDisputeAdminInQuestChatPreAccessPermissionHandler,
} from "../chat";
import {
  GetQuestDisputeByIdHandler,
  GetQuestDisputeByIdPostValidationHandler
} from "../quest/dispute/GetQuestDisputeByIdHandler";

export interface TakeQuestDisputeComposCommand {
  readonly meAdmin: Admin;
  readonly disputeId: string;
}

export class TakeQuestDisputeComposHandler extends BaseCompositeHandler<TakeQuestDisputeComposCommand, Promise<[Chat, Message, QuestDispute]>> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: TakeQuestDisputeComposCommand): Promise<[Chat, Message, QuestDispute]> {
    const questChat = await QuestChat.findOne({});

    const dispute = await new GetQuestDisputeByIdPostValidationHandler(
      new GetQuestDisputeByIdHandler()
    ).Handle({ disputeId: command.disputeId })

    const messageWithInfo: Message = await this.dbContext.transaction(async (tx) => {
      await new TakeQuestDisputeHandler()
        .setOptions({ tx })
        .Handle({ disputeAdmin: command.meAdmin, dispute })

      return await new AddDisputeAdminInQuestChatPreValidateHandler(
        new AddDisputeAdminInQuestChatPreAccessPermissionHandler(
          new AddDisputeAdminInQuestChatHandler().setOptions({ tx })
        )
      ).Handle({ disputeAdmin: command.meAdmin, questChat: questChat.chat });
    });

    return [questChat.chat, messageWithInfo, dispute];
  }
}
