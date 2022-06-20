import {error} from "../../../utils";
import {Errors} from "../../../utils/errors";
import {QuestDispute} from "@workquest/database-models/lib/models";

export class QuestDisputeValidator {
  public NotNull(questDispute: QuestDispute, disputeId: string) {
    if (!questDispute) {
      throw error(Errors.NotFound, 'Dispute is not found', { disputeId });
    }
  }
}
