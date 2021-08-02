import * as Joi from 'joi';


export const jwtTokenAccess = Joi.string().example("access jwt token");
export const jwtTokenRefresh = Joi.string().example("refresh jwt token");

export const outputOkSchema = (res: Joi.Schema): Joi.Schema => Joi.object({
  ok: Joi.boolean().example(true),
  result: res,
});

export function outputPaginationSchema(title: string, item: Joi.Schema): Joi.Schema {
  return Joi.object({
    ok: Joi.boolean().example(true),
    result: Joi.object({
      count: Joi.number().integer().example(10),
      [title]: Joi.array().items(item),
    }),
  });
}

export const emptyOutputSchema = Joi.object({
  ok: Joi.boolean().example(true)
}).label('EmptyOutputSchema')

export const jwtTokens = Joi.object({
  access: jwtTokenAccess,
  refresh: jwtTokenRefresh,
}).label("JwtTokensSchema");
