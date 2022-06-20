import { writeActionStatistics } from "../jobs/writeActionStatistics";
import {
  DisputesPlatformStatisticFields,
  ReportEntityType,
  ReportsPlatformStatisticFields
} from "@workquest/database-models/lib/models";

export class StatisticController {
  static async writeAction(payload) {
    await writeActionStatistics(payload);
  }

  static async takeDisputeToResolveAction() {
    await this.writeAction({
      incrementField: DisputesPlatformStatisticFields.InProgress,
      statistic: 'dispute',
      type: "increment"
    });
    await this.writeAction({
      incrementField: DisputesPlatformStatisticFields.Created,
      statistic: 'dispute',
      type: 'decrement'
    });
  }

  static async disputeDecideAction() {
    await this.writeAction({
      incrementField: DisputesPlatformStatisticFields.PendingClosed,
      statistic: 'dispute',
      type: 'increment'
    });
    await this.writeAction({
      incrementField: DisputesPlatformStatisticFields.InProgress,
      statistic: 'dispute',
      type: 'decrement'
    });
  }

  static async reportRejectAction(entityType: ReportEntityType) {
    if (entityType === ReportEntityType.DiscussionComment) {
      return;
    }

    await this.writeAction({
      incrementField: entityType === ReportEntityType.Quest
        ? ReportsPlatformStatisticFields.DeclinedQuests
        : ReportsPlatformStatisticFields.DeclinedUsers,
      statistic: 'report',
      type: 'increment',
    });
  }

  static async reportDecideAction(entityType: ReportEntityType) {
    if (entityType === ReportEntityType.DiscussionComment) {
      return;
    }

    await this.writeAction({
      incrementField: entityType === ReportEntityType.Quest
        ? ReportsPlatformStatisticFields.DecidedQuests
        : ReportsPlatformStatisticFields.DecidedUsers,
      statistic: 'report',
      type: 'increment',
    });
  }
}