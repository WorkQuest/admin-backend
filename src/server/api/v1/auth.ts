import { Errors } from "../../utils/errors";
import {output, error, getDevice, getGeo } from "../../utils";
import { Admin, AdminSession, } from "@workquest/database-models/lib/models"
import { Op } from "sequelize";
import updateLogoutAtJob from "../../jobs/updateLogoutAt";
import {generateJwt} from "../../utils/auth";
import {updateLastSessionJob} from "../../jobs/updateLastSession";

export async function login(r) {
  const admin = await Admin.scope("withPassword").findOne({
    where: {
      email: {
        [Op.iLike]: r.payload.email
      }
    }
  });

  if (!admin) {
    return error(Errors.NotFound, "Account not found", {});
  }
  if (!await admin.passwordCompare(r.payload.password)) {
    return error(Errors.NotFound, "Invalid password", {});
  }
  if(!await admin.validateTOTP(r.payload.totp)) {
    throw error(Errors.InvalidTOTP, "Invalid TOTP", {});
  }

  if (!admin.isActivated) {
    return error(Errors.InvalidStatus, 'Admin is deactivated', {});
  }

  const session = await AdminSession.create({
    adminId: admin.id,
    place: getGeo(r),
    device: getDevice(r),
    isActive: true,
  });

  await updateLastSessionJob({
    adminId: admin.id,
    sessionId: session.id,
  })

  return output({
    ...generateJwt({ id: session.id })
  });

}

export async function logout(r) {
  // TODO!!!!
  const admin = await Admin.findByPk(r.auth.credentials.id);
  if(!admin) {
    return error(Errors.NotFound, 'Account is not found', {});
  }
  await updateLogoutAtJob({
    sessionId: admin.lastSessionId,
  });

  return output();
}
