import {BaseDomainHandler} from "../../types";

export interface TakeQuestDisputeCommand {

}

export class TakeQuestDisputeHandler extends BaseDomainHandler<TakeQuestDisputeCommand, Promise<void>> {
  public async Handle(command: TakeQuestDisputeCommand): Promise<void> {

  }
}
