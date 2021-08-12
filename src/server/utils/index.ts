import { v4 as uuidv4, } from 'uuid';
import { Boom, } from '@hapi/boom';
import * as speakeasy from 'speakeasy';
import * as crypto from "crypto"
import config from "../config/config";
var geoip = require('geoip-lite');

export function getUUID(): string {
  return uuidv4();
}

export function getRealIp(request): string {
  return request.headers['X-Forwarded-For']
    ? request.headers['X-Forwarded-For']
    : request.info.remoteAddress;
}

//DO NOT WORK WITH LOCAL IP
export function getGeo(request): string {
  if (config.debug) {
    return "localhost";
  }
  let ip = getRealIp(request);
  let geo = geoip.lookup(ip);
  return geo.city
}

export function getDevice(request): string {
  return request.headers['user-agent'];
}

export function output(res?: object | null): object {
  return {
    ok: true,
    result: res,
  };
}

export function error(code: number, msg: string, data: object): Boom {
  return new Boom(msg, {
    data: {
      code,
      data,
      api: true,
    },
    statusCode: Math.floor(code / 1000),
  });
}

export function getHexConfirmToken(): string {
  return crypto.randomBytes(3).toString('hex');
}

export function totpValidate(totp: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: Number(totp),
  });
}

export function responseHandler(r, h) {
  // Handle default hapi errors (like not found, etc.)
  if (r.response.isBoom && r.response.data === null) {
    r.response = h
      .response({
        ok: false,
        code: Math.floor(r.response.output.statusCode * 1000),
        data: {},
        msg: r.response.message,
      })
      .code(r.response.output.statusCode);
    return h.continue;
  }

  // Handle custom api error
  if (r.response.isBoom && r.response.data.api) {
    r.response = h
      .response({
        ok: false,
        code: r.response.data.code,
        data: r.response.data.data,
        msg: r.response.output.payload.message,
      })
      .code(Math.floor(r.response.data.code / 1000));
    return h.continue;
  }

  // Handle non api errors with data
  if (r.response.isBoom && !r.response.data.api) {
    r.response = h
      .response({
        ok: false,
        code: Math.floor(r.response.output.statusCode * 1000),
        data: r.response.data,
        msg: r.response.message,
      })
      .code(r.response.output.statusCode);
    return h.continue;
  }

  return h.continue;
}

export async function handleValidationError(r, h, err) {
  return error(
    400000,
    'Validation error',
    err.details.map((e) => ({ field: e.context.key, reason: e.type.replace('any.', ''), }))
  );
}


