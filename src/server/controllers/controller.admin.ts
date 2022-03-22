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
