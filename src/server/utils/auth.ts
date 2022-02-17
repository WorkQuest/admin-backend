import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { error, } from './index';
import {
  Admin,
  AdminSession,
  AdminRole, AdminActionMethod,
} from "@workquest/database-models/lib/models";
import { Errors, } from './errors';
import saveAdminActions from "../jobs/saveAdminActions";

export const generateJwt = (data: object) => {
  const access = jwt.sign(data, config.auth.jwt.access.secret, { expiresIn: config.auth.jwt.access.lifetime, });
  const refresh = jwt.sign(data, config.auth.jwt.refresh.secret, { expiresIn: config.auth.jwt.refresh.lifetime, });

  return { access, refresh, };
};

export const decodeJwt = async (token: string, secret: string) => {
  try {
    return await jwt.verify(token, secret);
  }
  catch (e) {
    const code = e.name === 'TokenExpiredError' ? Errors.TokenExpired : Errors.TokenInvalid;
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Token invalid';
    throw error(code, msg, {});
  }
};

export type validateFunc = (r, token: string) => Promise<any>;
// Fabric which returns token validate function depending on token type
export function tokenValidate(tokenType: 'access' | 'refresh'): validateFunc {
  return async function (r, token: string) {
    const data = await decodeJwt(token, config.auth.jwt[tokenType].secret);

    const session = await AdminSession.findByPk(data.id, {
      include: [{ model: Admin}],
    });

    if (!session) {
      throw error(Errors.SessionNotFound, 'Session not found', {});
    }
    if (session.invalidating) {
      throw error(Errors.SessionNotFound, 'Session not found', {});
    }
    if (!session.admin) {
      throw error(Errors.NotFound, 'User not found', {});
    }
    if (!session.admin.isActive) {
      throw error(Errors.InvalidStatus, 'Admin is deactivate', {});
    }

    //if (r.method !== AdminActionMethod.Get) await saveAdminActions({ adminId: session.admin.id, method: r.method, path: r.path });

    return { isValid: true, credentials: session.admin, artifacts: { token, type: tokenType, sessionId: session.id } };
  };
}

export function getRbacSettings(...allowedGroups: AdminRole[]) {
  return {
    rbac: {
      apply: "permit-overrides",
      rules: [
        ...allowedGroups.map(role => ({
          target: {'credentials:role': role},
          effect: 'permit'
        })),
        {
          effect: "deny"
        }
      ]
    }
  }
}
