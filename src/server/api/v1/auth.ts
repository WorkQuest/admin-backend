import {Errors} from "../../utils/errors";
import {output, error, getDevice, getGeo, getRealIp } from "../../utils";
import {Admin, AdminSession} from "@workquest/database-models/lib/models"
import {Op} from "sequelize";
import {generateJwt} from "../../utils/auth";
import {saveAdminActionsMetadataJob} from "../../jobs/saveAdminActionsMetadata";

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
    invalidating: false,
  });

  await saveAdminActionsMetadataJob({ adminId: admin.id, HTTPVerb: r.method, path: r.path });

  return output({
    ...generateJwt({ id: session.id })
  });

}

export async function refreshTokens(r) {
  const newSession = await AdminSession.create({
    adminId: r.auth.credentials.id,
    invalidating: false,
    place: getGeo(r),
    ip: getRealIp(r),
    device: getDevice(r),
  });

  const result = {
    ...generateJwt({ id: newSession.id }),
    userStatus: r.auth.credentials.status,
  };

  return output(result);
}


export async function logout(r) {
  await AdminSession.update({
    invalidating: true,
    logoutAt: Date.now(),
  }, {
    where: { id: r.auth.artifacts.sessionId }
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}
