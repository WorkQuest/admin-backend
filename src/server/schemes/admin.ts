import Joi = require("joi");
import {
	emailSchema,
	firstNameSchema,
	idSchema,
	lastNameSchema,
} from "./common";

import { AdminRole, adminRoles, AdminStatus, adminStatuses } from "../models/Admin";

export const adminRoleSchema = Joi.string().allow(...adminRoles).default(AdminRole.MAIN_ADMIN);
export const adminStatusSchema = Joi.string().allow(...adminStatuses).default(AdminStatus.UNCONFIRMED);

export const accountSchema = Joi.object({
	id: idSchema,

    email: emailSchema,
	firstName: firstNameSchema,
	lastName: lastNameSchema,

	adminRole: adminRoleSchema,
	adminStatus: adminStatusSchema,
}).label('AccountSchema')
