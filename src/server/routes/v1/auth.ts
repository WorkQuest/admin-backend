import * as Joi from "joi";
import * as handlers from "../../api/v1/auth";
import {
  jwtTokens,
  totpSchema,
  emptyOkSchema,
  outputOkSchema,
  adminEmailSchema,
  adminPasswordSchema, tokensWithStatus,
} from "@workquest/database-models/lib/schemes";
import {refreshTokens} from "../../api/v1/auth";

export default[{
  method: "POST",
  path: "/v1/auth/logout",
  handler: handlers.logout,
  options: {
    id: "v1.auth.logout",
    tags: ["api", "auth"],
    description: "Logout from account",
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/login",
  handler: handlers.login,
  options: {
    auth: false,
    id: "v1.auth.login",
    tags: ["api", "auth"],
    description: "Login into account",
    validate: {
      payload: Joi.object({
        email: adminEmailSchema.required(),
        password: adminPasswordSchema.required(),
        totp: totpSchema,
      }).label("AuthLoginPayload")
    },
    response: {
      schema: outputOkSchema(jwtTokens).label("TokensResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/refresh-tokens",
  handler: refreshTokens,
  options: {
    auth: 'jwt-refresh',
    id: "v1.auth.refreshTokens",
    tags: ["api", "auth"],
    description: "Refresh auth tokens",
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
},]
