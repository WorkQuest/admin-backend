import {Admin, QuestDispute} from "@workquest/database-models/lib/models";
import {DisputeDecision} from "@workquest/database-models/src/models/quest/QuestDispute";

/** Commands */

export interface TakeQuestDisputeCommand {
  readonly disputeAdmin: Admin;
  readonly dispute: QuestDispute;
}

export interface DecideQuestDisputeCommand {
  readonly disputeAdmin: Admin;
  readonly dispute: QuestDispute;
  readonly decision: DisputeDecision;
  readonly decisionDescription: string;
}

/** Results */

export type TakeQuestDisputeResult = Promise<void>;

export type DecideQuestDisputeResult = Promise<void>;
