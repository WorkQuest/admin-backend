import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { error, } from './index';
import { Admin,
  AdminSession,
  AdminRole,
} from "@workquest/database-models/lib/models";
import { Errors, } from './errors';


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

    const { admin } = await AdminSession.findByPk(data.id, {
      include: [{ model: Admin}],
    });

    if (admin) {
      return { isValid: true, credentials: admin, artifacts: { token, type: tokenType, }, };
    }
    throw error(Errors.SessionNotFound, 'User not found', {});
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
