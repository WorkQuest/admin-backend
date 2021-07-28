import { Sequelize, } from 'sequelize-typescript';
import config from '../config/config';
import { User, } from './User';
import { Session, } from './Session';
import { UserAvatar } from './UserAvatar';
import { Admin } from './Admin';

const sequelize = new Sequelize(config.dbLink, {
  dialect: 'postgres',
  models: [User, Session, UserAvatar, Admin],
});
sequelize.sync();
export default sequelize;
