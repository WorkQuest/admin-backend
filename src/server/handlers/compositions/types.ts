import {
  Chat,
  Admin,
  Message,
  ChatMember,
  InfoMessage,
  QuestDispute,
  DisputeDecision,
} from "@workquest/database-models/lib/models";

/** Commands */

export interface TakeQuestDisputeComposCommand {
  readonly meAdmin: Admin;
  readonly disputeId: string;
}

export interface DecideQuestDisputeComposCommand {
  readonly meAdmin: Admin;
  readonly disputeId: string;
  readonly decision: DisputeDecision;
  readonly decisionDescription: string,
}

/** Results */

export type TakeQuestDisputeComposResults = Promise<[
  QuestDispute,
  Chat,
  ChatMember,
  [Message, InfoMessage],
]>;

export type DecideQuestDisputeComposResults = Promise<[
  Chat,
  QuestDispute,
  [Message, InfoMessage],
]>;


