import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Scopes,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import { getUUID, } from '../utils';
import { User, } from './User';

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
export class UserAvatar extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(), })
  id: string;

  @ForeignKey(() => User)
  @Column(DataType.STRING)
  userId: number;

  @Column(DataType.BLOB)
  image: Buffer;

  @BelongsTo(() => User)
  user: User;
}
