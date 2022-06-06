import {Op} from "sequelize";
import {BaseCompositeHandler} from "../types";
import {TakeQuestDisputeComposCommand, TakeQuestDisputeComposResults} from "./types";
import {QuestChat, Message, InfoMessage, ChatMember, Chat} from "@workquest/database-models/lib/models";
import {
  TakeQuestDisputeHandler,
  TakeQuestDisputePreAccessPermissionHandler,
} from "../quest/dispute/TakeQuestDisputeHandler";
import {
  GetQuestDisputeByIdHandler,
  GetQuestDisputeByIdPostValidationHandler,
} from "../quest/dispute/GetQuestDisputeByIdHandler";
import {
  AddDisputeAdminInQuestChatHandler,
  AddDisputeAdminInQuestChatPreValidateHandler,
  AddDisputeAdminInQuestChatPreAccessPermissionHandler,
} from "../chat";

export class TakeQuestDisputeComposHandler extends BaseCompositeHandler<TakeQuestDisputeComposCommand, TakeQuestDisputeComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: TakeQuestDisputeComposCommand): TakeQuestDisputeComposResults {
    const dispute = await new GetQuestDisputeByIdPostValidationHandler(
      new GetQuestDisputeByIdHandler()
    ).Handle({ disputeId: command.disputeId });

    // TODO в хендлер
    const { chat } = await QuestChat.findOne({
      where: {
        questId: dispute.questId,
        employerId: { [Op.or]: [dispute.openDisputeUserId, dispute.opponentUserId] },
        workerId: { [Op.or]: [dispute.openDisputeUserId, dispute.opponentUserId] },
      },
      include: {
        model: Chat,
        as: 'chat',
      }
    });

    const [meAdminChatMember, [message, infoMessage]] = await this.dbContext.transaction(async (tx) => {
      await new TakeQuestDisputePreAccessPermissionHandler(
        new TakeQuestDisputeHandler().setOptions({ tx })
      ).Handle({ disputeAdmin: command.meAdmin, dispute })

      return await new AddDisputeAdminInQuestChatPreValidateHandler(
        new AddDisputeAdminInQuestChatPreAccessPermissionHandler(
          new AddDisputeAdminInQuestChatHandler().setOptions({ tx })
        )
      ).Handle({ admin: command.meAdmin, questChat: chat });
    }) as [ChatMember, [Message, InfoMessage]];

    return [
      dispute,
      chat,
      meAdminChatMember,
      [message, infoMessage],
    ];
  }
}
