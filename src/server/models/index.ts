import { Sequelize, } from 'sequelize-typescript';
import config from '../config/config';
import { User, } from './User';
import { Session, } from './Session';
import { UserAvatar } from './UserAvatar';
import { Admin } from './Admin';

export async function initDatabase(
  dbLink: string,
  logging = false,
  sync: boolean = false
) {
  let sequelize: Sequelize;

  sequelize = new Sequelize(dbLink, {
    dialect: "postgres",
    models: [
      User,
      Admin,
      UserAvatar,
      Session
    ],
    logging: logging,
  })

  if (sync) await sequelize.sync();

  return { sequelize };
}

