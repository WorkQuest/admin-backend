import {
  Column, DataType, Model, Scopes, Table, HasOne,
} from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import { getUUID, } from '../utils';
import { UserAvatar, } from './UserAvatar';

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ['password'],
    },
  },
  withPassword: {
    attributes: {
      include: ['password'],
    },
  },
}))
@Table
export class User extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(), }) id: string;

  @HasOne(() => UserAvatar)
  avatar: UserAvatar;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(value, salt);
      // @ts-ignore
      this.setDataValue('password', hash);
    },
    get() {
      // @ts-ignore
      return this.getDataValue('password');
    },
  })
  password: string;

  async passwordCompare(pwd: string) {
    return bcrypt.compareSync(pwd, this.password);
  }
}
