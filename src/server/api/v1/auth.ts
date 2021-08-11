import { Errors } from "../../utils/errors";
import {output, error, getRealIp, getDevice, getGeo} from "../../utils";
import { Admin, } from "@workquest/database-models/lib/models"
import { Op } from "sequelize";
import updateDevicePlaceLoginAtJob from "../../jobs/updateDevicePlaceLoginAt";
import updateLogoutAtJob from "../../jobs/updateLogoutAt";

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
  // if(!await admin.validateTOTP(r.payload.totp)) {
  //   throw error(Errors.InvalidTOTP, "Invalid TOTP", {});
  // }

  await updateDevicePlaceLoginAtJob({
    admin: admin,
    device: getDevice(r),
    place: getGeo(r),
  });
  console.log(getGeo(r))


  // const session = await AdminSession.create({
  //   adminId: account.id
  // });
  //
  // return output({
  //   ...generateJwt({ id: session.id })
  // });
}

export async function logout(r) {
  // TODO
  const admin = await Admin.findByPk(r.auth.credentials.id);
  if(!admin) {
    return error(Errors.NotFound, 'Account is not found', {});
  }
  await updateLogoutAtJob(admin);

  return output();
}
