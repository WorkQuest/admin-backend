import { Sequelize, } from 'sequelize-typescript';
import config from '../config/config';
import { User, } from './User';
import { Session, } from './Session';
import { UserAvatar } from './UserAvatar';

const sequelize = new Sequelize(config.dbLink, {
  dialect: 'postgres',
  models: [User, Session, UserAvatar],
});
sequelize.sync();
export default sequelize;
