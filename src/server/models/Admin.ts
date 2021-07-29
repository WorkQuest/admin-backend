import {
    Column, DataType, Model, Scopes, Table, HasOne, HasMany,
  } from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import { getUUID, } from '../utils';
import { Session } from './Session';
  
  export enum AdminRole {
    MAIN_ADMIN = "main_admin",
    DISPUT_ADMIN = "disput_admin",
    ADVERTISING_ADMIN = "advertising_admin",
    KYC_ADMIN = "kyc_admin",
  }
  export const adminRoles= Object.values(AdminRole)

  export enum AdminStatus {
    CONFIRMED = "confirmed",
    UNCONFIRMED = "unconfirmed",
  }
  export const adminStatuses = Object.values(AdminStatus)
  
  export interface AccountSettings {
    confirmCode: string | null
    confirmCodeValidUntil: string | null
  
    changePasswordCode: string | null
    changePasswordCodeValidUntil: string | null
  }

  export const accountSettingsDefault: AccountSettings = {
    confirmCode: null,
    confirmCodeValidUntil: null,
  
    changePasswordCode: null,
    changePasswordCodeValidUntil: null
  }

  @Scopes(() => ({
    defaultScope: {
      attributes: {
        exclude: ["password", "settings", "createdAt", "updatedAt", "deletedAt"],
      },
    },
    withPassword: {
      attributes: {
        include: ["password", "settings"],
      },
    },
  }))
  @Table
  export class Admin extends Model {
    @Column({ type: DataType.STRING, defaultValue: getUUID, primaryKey: true }) 
    id: string;

    @Column({type: DataType.STRING, unique: true}) 
    email: string
  
    @Column({
      type: DataType.STRING,
      set(value: string) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(value, salt);
        this.setDataValue('password', hash);
      },
      get() {
        return this.getDataValue('password');
      },
    })
    password: string;

    @Column(DataType.STRING) 
    firstName: string
    @Column(DataType.STRING) 
    lastName: string

    @Column({type: DataType.STRING, defaultValue: AdminRole.MAIN_ADMIN}) 
    adminRole: AdminRole
    @Column({type: DataType.STRING, defaultValue: AdminStatus.UNCONFIRMED}) 
    adminStatus: AdminStatus
    @Column({ type: DataType.JSONB, defaultValue: accountSettingsDefault })
    settings: AccountSettings;

    async passwordCompare(pwd: string) {
      return bcrypt.compareSync(pwd, this.password);
    }
  }