import { Sequelize, } from 'sequelize-typescript';
import config from '../config/config';
import { Session, } from './Session';
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
      Admin,
      Session
    ],
    logging: logging,
  })

  if (sync) await sequelize.sync();

  return { sequelize };
}

