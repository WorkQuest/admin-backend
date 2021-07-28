import Joi = require("joi")

export const idSchema = Joi.string().uuid().example('bfed0026-9ddf-4bf2-b941-791ca85040ff')
export const isoDateSchema = Joi.string().isoDate().example('2021-03-23T04:22:47.724Z')
export const countField = Joi.number().integer().example(10)

export const firstNameSchema = Joi.string().max(255).example('Pavel');
export const lastNameSchema = Joi.string().max(255).example('Durov');
export const middleNameSchema = Joi.string().max(255).example('Valerievich');
export const fullNameSchema = Joi.string().max(255).example('Pavel Durov');
export const activityFieldSchema = Joi.string().max(255).example('Banking');
export const missionSchema = Joi.string().max(255).example('Change the world');
export const descriptionSchema = Joi.string().max(4000).example('some very detailed description');
export const sumsubVerifiedSchema = Joi.boolean().example(false)

export const emailSchema = Joi.string().email().max(255).example('test@test.com');
export const phoneSchema = Joi.string().max(255).example('88005553535')
export const passwordSchema = Joi.string().min(8).max(255) // TODO: describe custom validator rule

export const jwtToken = Joi.string().example('jwt token');
export const hexToken = Joi.string().regex(/^[0-9a-fA-F]{40}$/).example('9997632b8e470e6fc7b48fac0528f06b5581ac29').label('HexToken')
export const base64String = Joi.string().example('base64 string');

export const paginationFields = {
	limit: Joi.number().integer().default(10).max(100).example(10),
	offset: Joi.number().integer().default(0).example(5)
};