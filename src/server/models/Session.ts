import {
  BelongsTo, Column, DataType, ForeignKey, Model, Table,
} from 'sequelize-typescript';
import { getUUID, } from '../utils';
import { Admin } from './Admin';

@Table
export class Session extends Model {
  @Column({ type: DataType.STRING, defaultValue: getUUID, primaryKey: true }) 
  id: string;

  @ForeignKey(() => Admin) 
  @Column(DataType.STRING) userId: string;

  @BelongsTo(() => Admin) user: Admin;
}
