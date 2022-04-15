import {error} from "../utils";
import {Transaction} from "sequelize";
import {Errors} from "../utils/errors";
import {SkillsFiltersController} from "./controller.skillsFilters";
import {
  User,
  Quest,
  QuestChat,
  QuestStatus,
  QuestsStarred,
  QuestsResponse,
  QuestSpecializationFilter,
} from "@workquest/database-models/lib/models";

abstract class QuestHelper {
  public abstract quest: Quest;

  public setStar(user: User) {
    return QuestsStarred.findOrCreate({
      where: { userId: user.id, questId: this.quest.id },
      defaults: { userId: user.id, questId: this.quest.id },
    });
  }

  public removeStar(user: User) {
    return QuestsStarred.destroy({
      where: { userId: user.id, questId: this.quest.id },
    });
  }

  public async setMedias(medias, transaction?: Transaction) {
    try {
      await this.quest.$set('medias', medias, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }

      throw e;
    }
  }

  public async setQuestSpecializations(keys: string[], isCreatedNow = false, transaction?: Transaction) {
    try {
      if (!isCreatedNow) {
        await QuestSpecializationFilter.destroy({ where: { questId: this.quest.id }, transaction });
      }
      if (keys.length <= 0) {
        return;
      }

      const skillsFiltersController = await SkillsFiltersController.getInstance();
      const questSpecializations = await skillsFiltersController.keysToRecords(keys, 'questId', this.quest.id);

      await QuestSpecializationFilter.bulkCreate(questSpecializations, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  /** Checks list */
  public employerMustBeQuestCreator(userId: String): QuestHelper {
    if (this.quest.userId !== userId) {
      throw error(Errors.Forbidden, "User is not quest creator", {
        current: this.quest.userId,
        mustHave: userId,
      });
    }

    return this;
  }

  public questMustHaveStatus(...statuses: QuestStatus[]): QuestHelper {
    if (!statuses.includes(this.quest.status)) {
      throw error(Errors.InvalidStatus, "Quest status doesn't match", {
        current: this.quest.status,
        mustHave: statuses,
      });
    }

    return this;
  }

  public workerMustBeAppointedOnQuest(workerId: string): QuestHelper {
    if (this.quest.assignedWorkerId !== workerId) {
      throw error(Errors.Forbidden, "Worker is not appointed on quest", {
        current: this.quest.userId,
        mustHave: workerId,
      });
    }

    return this;
  }

  public userMustBelongToQuest(userId: string): QuestHelper {
    if (userId !== this.quest.userId && userId !== this.quest.assignedWorkerId) {
      throw error(Errors.Forbidden, "User does not belong to quest", {});
    }

    return this;
  }
}

export class QuestController extends QuestHelper {
  constructor(
    public quest: Quest,
  ) {
    super();

    if (!quest) {
      throw error(Errors.NotFound, "Quest not found", {});
    }
  }

  public async start(assignedWorker: User, transaction?: Transaction) {
    try {
      this.quest = await this.quest.update({
        assignedWorkerId: assignedWorker.id,
        status: QuestStatus.WaitingForConfirmFromWorkerOnAssign,
      }, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async close(transaction?: Transaction) {
    try {
      this.quest = await this.quest.update({
        status: QuestStatus.Closed,
      }, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async completeWork(transaction?: Transaction) {
    try {
      this.quest = await this.quest.update({
        status: QuestStatus.WaitingForEmployerConfirmationWork,
      }, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async approveCompletedWork(transaction?: Transaction) {
    try {
      this.quest = await this.quest.update({
        status: QuestStatus.Completed,
      }, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async rejectCompletedWork(transaction?: Transaction) {
    try {
      this.quest = await this.quest.update({
        status: QuestStatus.Dispute
      }, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  async answerWorkOnQuest(worker: User, acceptWork: boolean, transaction: Transaction) {
    try {
      if (acceptWork) {
        this.quest = await this.quest.update({
          status: QuestStatus.ExecutionOfWork,
        }, { transaction });
      } else {
        this.quest = await this.quest.update({
          status: QuestStatus.Pending,
          assignedWorkerId: null,
        }, { transaction });
      }
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async destroy(transaction?: Transaction) {
    try {
      await QuestChat.destroy({ where: { questId: this.quest.id }, transaction });
      await QuestSpecializationFilter.destroy({ where: { questId: this.quest.id }, transaction });
      await QuestsResponse.destroy({ where: { questId: this.quest.id }, transaction })
      await this.quest.destroy({ force: true, transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public static get(id) {

  }
}
