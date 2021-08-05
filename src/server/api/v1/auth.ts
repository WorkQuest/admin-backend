import { Errors } from "../../utils/errors";
import { output, error} from "../../utils";
import { Admin, AdminSession} from "@workquest/database-models/lib/models"
import { generateJwt, } from "../../utils/auth";
import { Op } from "sequelize";

export async function login(r) {
  const account = await Admin.scope("withPassword").findOne({
    where: {
      email: {
        [Op.iLike]: r.payload.email
      }
    }
  });

  if (!account) {
    return error(Errors.NotFound, "Account not found", {});
  }

  if (!await account.passwordCompare(r.payload.password)) {
    return error(Errors.NotFound, "Invalid password", {});
  }

  if(!await account.validateTOTP(r.payload.totp)) {
    throw error(Errors.InvalidTOTP, "Invalid TOTP", {});
  }

  const session = await AdminSession.create({
    adminId: account.id
  });

  return output({ ...generateJwt({ id: session.id })});
}

export async function logout(r) {
  await AdminSession.destroy({
    where: {
      adminId: r.auth.credentials.id
    }
  })
  return output()
}
