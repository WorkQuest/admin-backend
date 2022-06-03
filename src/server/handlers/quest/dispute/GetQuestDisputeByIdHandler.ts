import {QuestDisputeValidator} from "./QuestDisputeValidator";
import {QuestDispute} from "@workquest/database-models/lib/models";
import {BaseDomainHandler, HandlerDecoratorBase, IHandler} from "../../types";

export interface GetQuestDisputeByIdCommand {
  readonly disputeId: string;
}

export class GetQuestDisputeByIdHandler extends BaseDomainHandler<GetQuestDisputeByIdCommand, Promise<QuestDispute>> {
  public async Handle(command: GetQuestDisputeByIdCommand): Promise<QuestDispute> {
    return await QuestDispute.findByPk(command.disputeId, { transaction: this.options.tx });
  }
}

export class GetQuestDisputeByIdPostValidationHandler<Tin extends { disputeId: string }> extends HandlerDecoratorBase<Tin, Promise<QuestDispute>> {

  private readonly validator: QuestDisputeValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<QuestDispute>>,
  ) {
    super(decorated);

    this.validator = new QuestDisputeValidator();
  }

  public async Handle(command: Tin): Promise<QuestDispute> {
    const dispute = await this.decorated.Handle(command);

    this.validator.NotNull(dispute, command.disputeId);

    return dispute;
  }
}


