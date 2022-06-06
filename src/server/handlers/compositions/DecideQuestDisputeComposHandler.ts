import {Op} from "sequelize";
import {BaseCompositeHandler} from "../types";
import {QuestChat, Chat} from "@workquest/database-models/lib/models";
import {
  DecideQuestDisputeComposCommand,
  DecideQuestDisputeComposResults,
} from "./types";
import {
  GetQuestDisputeByIdHandler,
  GetQuestDisputeByIdPostValidationHandler,
} from "../quest/dispute/GetQuestDisputeByIdHandler";
import {
  DecideQuestDisputeHandler,
  DecideQuestDisputePreAccessPermissionHandler,
} from "../quest/dispute/DecideQuestDisputeHandler";
import {
  LeaveFromQuestChatHandler,
  GetChatMemberByAdminHandler,
  GetChatMemberPostValidationHandler,
  LeaveFromQuestChatPreValidateHandler,
  GetChatMemberPostFullAccessPermissionHandler,
  LeaveFromQuestChatPreAccessPermissionHandler,
} from "../chat";

export class DecideQuestDisputeComposHandler extends BaseCompositeHandler<DecideQuestDisputeComposCommand, DecideQuestDisputeComposResults> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: DecideQuestDisputeComposCommand): DecideQuestDisputeComposResults {
    const dispute = await new GetQuestDisputeByIdPostValidationHandler(
      new GetQuestDisputeByIdHandler()
    ).Handle({ disputeId: command.disputeId })

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

    const meAdminChatMember = await new GetChatMemberPostFullAccessPermissionHandler(
      new GetChatMemberPostValidationHandler(
        new GetChatMemberByAdminHandler()
      )
    ).Handle({ chat, admin: command.meAdmin });

    const [message, infoMessage] = await this.dbContext.transaction(async (tx) => {
      await new DecideQuestDisputePreAccessPermissionHandler(
        new DecideQuestDisputeHandler().setOptions({ tx })
      ).Handle({ disputeAdmin: command.meAdmin, dispute, ...command });

      return await new LeaveFromQuestChatPreValidateHandler(
        new LeaveFromQuestChatPreAccessPermissionHandler(
          new LeaveFromQuestChatHandler().setOptions({ tx })
        )
      ).Handle({ member: meAdminChatMember, questChat: chat });
    });

    return [
      chat,
      dispute,
      [message, infoMessage]
    ];
  }
}
