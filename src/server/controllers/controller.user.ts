import {Transaction} from 'sequelize';

import {
  User,
  UserRole,
  UserStatus,
  UserChatsStatistic,
  QuestsStatistic,
  RatingStatistic
} from '@workquest/database-models/lib/models';
import {error, totpValidate} from "../utils";
import {Errors} from "../utils/errors";

abstract class UserHelper {
  public abstract user: User;


  public static getDefaultAdditionalInfo(role: UserRole) {
    let additionalInfo: object = {
      description: null,
      secondMobileNumber: null,
      address: null,
      socialNetwork: {
        instagram: null,
        twitter: null,
        linkedin: null,
        facebook: null,
      },
    };

    if (role === UserRole.Worker) {
      additionalInfo = {
        ...additionalInfo,
        skills: [],
        educations: [],
        workExperiences: [],
      };
    } else if (role === UserRole.Employer) {
      additionalInfo = {
        ...additionalInfo,
        company: null,
        CEO: null,
        website: null,
      };
    }

    return additionalInfo;
  }


  /** Checks list */

  public static async userMustExist(userId: string) {
    if (!(await User.findByPk(userId))) {
      throw error(Errors.NotFound, 'User does not exist', {userId});
    }
  }

  public static async usersMustExist(
    userIds: string[],
    scope: 'defaultScope' | 'short' | 'shortWithAdditionalInfo' = 'defaultScope',
  ): Promise<User[]> {
    const users = await User.scope(scope).findAll({
      where: {id: userIds},
    });

    if (users.length !== userIds.length) {
      const notFoundIds = userIds.filter((userId) => users.findIndex((user) => userId === user.id) === -1);

      throw error(Errors.NotFound, 'Users is not found', {notFoundIds});
    }

    return users;
  }

  public userMustHaveActiveStatusTOTP(activeStatus: boolean): this {
    if (this.user.settings.security.TOTP.active !== activeStatus) {
      throw error(Errors.InvalidActiveStatusTOTP, `Active status TOTP is not ${activeStatus ? 'enable' : 'disable'}`, {});
    }

    return this;
  }

  public checkTotpConfirmationCode(code): this {
    if (!totpValidate(code, this.user.settings.security.TOTP.secret)) {
      throw error(Errors.InvalidPayload, 'TOTP is invalid', [{ field: 'totp', reason: 'invalid' }]);
    }

    return this;
  }

  public userNeedsSetRole(): this {
    if (this.user.status !== UserStatus.NeedSetRole) {
      throw error(Errors.InvalidPayload, "User don't need to set role", {
        role: this.user.role,
      });
    }

    return this;
  }

  public static async createStatistics(userId) {
    await RatingStatistic.findOrCreate({
      where: {userId: userId},
      defaults: {userId: userId},
    });
    await UserChatsStatistic.findOrCreate({
      where: {userId: userId},
      defaults: {userId: userId},
    });
    await QuestsStatistic.findOrCreate({
      where: {userId: userId},
      defaults: {userId: userId},
    });
  }
}

export class UserController extends UserHelper {
  constructor(public user: User) {
    super();

    if (!user) {
      throw error(Errors.NotFound, 'User not found', {});
    }
  }

  public async setRole(role: UserRole, transaction?: Transaction) {
    try {
      this.user = await this.user.update({
        status: UserStatus.Confirmed,
        role,
        additionalInfo: UserController.getDefaultAdditionalInfo(role),
      });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }
}
