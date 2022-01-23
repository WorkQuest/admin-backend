import {Errors} from "../../utils/errors";
import {output, error, getDevice, getGeo } from "../../utils";
import {Admin, AdminSession} from "@workquest/database-models/lib/models"
import {Op} from "sequelize";
import {generateJwt} from "../../utils/auth";

export async function login(r) {
  const admin = await Admin.scope("withPassword").findOne({ where: { email: { [Op.iLike]: r.payload.email } } });

  if (!admin) {
    return error(Errors.NotFound, "Account not found", {});
  }

  if (!await admin.passwordCompare(r.payload.password)) {
    return error(Errors.NotFound, "Invalid password", {});
  }

  if(!await admin.validateTOTP(r.payload.totp)) {
    throw error(Errors.InvalidTOTP, "Invalid TOTP", {});
  }

  const session = await AdminSession.create({
    adminId: admin.id,
    isActive: true,
  });

  return output({
    ...generateJwt({ id: session.id })
  });

}

export async function logout(r) {
  await AdminSession.update({
    invalidating: true,
    logoutAt: Date.now(),
  }, {
    where: { id: r.auth.artifacts.sessionId }
  });

  return output();
}
