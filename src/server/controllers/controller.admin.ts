import { Op, Transaction } from 'sequelize';
import { error } from '../utils';
import { Errors } from '../utils/errors';
import {
  Admin,
} from "@workquest/database-models/lib/models";

//check something
abstract class AdminHelper {
  public abstract admin: Admin;

  public static async adminMustExists(userId: string) {
    if (!(await Admin.findByPk(userId))) {
      throw error(Errors.NotFound, 'Admin does not exist', { userId });
    }
  }
  public static async adminsMustExist(
    adminIds: string[],
  ): Promise<Admin[]> {
    const admins = await Admin.findAll({
      where: { id: adminIds },
    });

    if (admins.length !== adminIds.length) {
      const notFoundIds = adminIds.filter((adminId) => admins.findIndex((admin) => adminId === admin.id) === -1);

      throw error(Errors.NotFound, 'Users is not found', { notFoundIds });
    }

    return admins;
  }

}

//set, change and so on
export class AdminController extends AdminHelper {
  constructor(public admin: Admin) {
    super();

    if (!admin) {
      throw error(Errors.NotFound, 'User not found', {});
    }
  }
}
