import { AdminValidator } from './AdminValidator';
import { HandlerDecoratorBase, IHandler } from '../types';
import { Admin } from '@workquest/database-models/lib/models';
import { AdminAccessPermission } from './AdminAccessPermission';

export interface GetAdminsByIdCommand {
  readonly adminId: string;
}

export interface GetAdminsByIdsCommand {
  readonly adminIds: Array<string>;
}

export class GetAdminsByIdHandler implements IHandler<GetAdminsByIdCommand, Promise<Admin>> {
  public async Handle(command: GetAdminsByIdCommand): Promise<Admin> {
    return await Admin.findByPk(command.adminId);
  }
}

export class GetAdminsByIdsHandler implements IHandler<GetAdminsByIdsCommand, Promise<Admin[]>> {
  public async Handle(command: GetAdminsByIdsCommand): Promise<Admin[]> {
    return await Admin.findAll({ where: { id: command.adminIds } });
  }
}

export class GetAdminsByIdPostValidationHandler extends HandlerDecoratorBase<GetAdminsByIdCommand, Promise<Admin>> {

  private readonly validator: AdminValidator;

  constructor(
    protected readonly decorated: IHandler<GetAdminsByIdCommand, Promise<Admin>>,
  ) {
    super(decorated);

    this.validator = new AdminValidator();
  }

  public async Handle(command: GetAdminsByIdCommand): Promise<Admin> {
    const admin = await this.decorated.Handle(command);

    this.validator.NotNull(admin, command.adminId);

    return admin;
  }
}

export class GetAdminsByIdPostAccessPermissionHandler extends HandlerDecoratorBase<GetAdminsByIdCommand, Promise<Admin>> {

  private readonly accessPermission: AdminAccessPermission;

  constructor(
    protected readonly decorated: IHandler<GetAdminsByIdCommand, Promise<Admin>>,
  ) {
    super(decorated);

    this.accessPermission = new AdminAccessPermission();
  }

  public async Handle(command: GetAdminsByIdCommand): Promise<Admin> {
    const admin = await this.decorated.Handle(command);

    this.accessPermission.AdminIsActiveAccess(admin);

    return admin;
  }
}

export class GetAdminsByIdsPostValidationHandler extends HandlerDecoratorBase<GetAdminsByIdsCommand, Promise<Admin[]>> {

  private readonly validator: AdminValidator;

  constructor(
    protected readonly decorated: IHandler<GetAdminsByIdsCommand, Promise<Admin[]>>,
  ) {
    super(decorated);

    this.validator = new AdminValidator();
  }

  public async Handle(command: GetAdminsByIdsCommand): Promise<Admin[]> {
    const admins = await this.decorated.Handle(command);

    this.validator.HasCompleteSetValidate(admins, command.adminIds as string[]);

    return admins;
  }
}

export class GetAdminsByIdsPostAccessPermissionHandler extends HandlerDecoratorBase<GetAdminsByIdsCommand, Promise<Admin[]>> {

  private readonly accessPermission: AdminAccessPermission;

  constructor(
    protected readonly decorated: IHandler<GetAdminsByIdsCommand, Promise<Admin[]>>,
  ) {
    super(decorated);

    this.accessPermission = new AdminAccessPermission();
  }

  public async Handle(command: GetAdminsByIdsCommand): Promise<Admin[]> {
    const admins = await this.decorated.Handle(command);

    this.accessPermission.AdminsAreActiveAccess(admins);

    return admins;
  }
}



