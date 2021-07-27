import * as Joi from 'joi';

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

const user = Joi.object({
  name: Joi.string(),
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(6)
    .required(),
});

export { user, };
