import { Errors } from "../../utils/errors";
import { output, error, getDevice, getGeo, getRealIp } from "../../utils";
import { Admin, AdminSession, AdminWallet } from "@workquest/database-models/lib/models"
import { Op } from "sequelize";
import { generateJwt } from "../../utils/auth";
import { saveAdminActionsMetadataJob } from "../../jobs/saveAdminActionsMetadata";

import converter from 'bech32-converting';

export async function login(r) {
  const admin = await Admin.scope("withPassword").findOne({
    where: { email: { [Op.iLike]: r.payload.email } },
    include: {
      model: AdminWallet,
      as: 'wallet',
      required: false
    }
  });

  if (!admin) {
    return error(Errors.NotFound, "User not found or password does not match", {});
  }

  if (!await admin.passwordCompare(r.payload.password)) {
    return error(Errors.NotFound, "User not found or password does not match", {});
  }

  if (!await admin.validateTOTP(r.payload.totp)) {
    throw error(Errors.InvalidTOTP, "Invalid TOTP", {});
  }

  const session = await AdminSession.create({
    adminId: admin.id,
    invalidating: false,
    place: getGeo(r),
    ip: getRealIp(r),
    device: getDevice(r),
  });

  await saveAdminActionsMetadataJob({ adminId: admin.id, HTTPVerb: r.method, path: r.path });

  return output({
    ...generateJwt({ id: session.id, adminId: admin.id }),
    address: admin.wallet ? admin.wallet.address : null,
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
    ...generateJwt({ id: newSession.id, adminId: newSession.adminId }),
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

export async function registerWallet(r) {
  const { id } = r.auth.credentials;
  const { publicKey, address } = r.payload;

  const [_, isCreated] = await AdminWallet.findOrCreate({
    where: {
      [Op.or]: {
        adminId: id,
        publicKey: publicKey.toLowerCase(),
        address: address.toLowerCase(),
      }
    },
    defaults: {
      adminId: id,
      publicKey: publicKey.toLowerCase(),
      address: address.toLowerCase(),
    }
  });

  if (!isCreated) {
    return error(Errors.WalletExists, 'Wallet already exists', {});
  }

  const bech32Address = converter('wq').toBech32(address);

  return output({
    address,
    bech32Address,
  });
}
