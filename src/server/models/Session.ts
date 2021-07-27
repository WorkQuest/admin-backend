import {
  BelongsTo, Column, DataType, ForeignKey, Model,
} from 'sequelize-typescript';
import { getUUID, } from '../utils';
import { User, } from './User';

export class Session extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID(), }) id: string;

  @ForeignKey(() => User) @Column(DataType.STRING) userId: string;

  @BelongsTo(() => User) user: User;
}
