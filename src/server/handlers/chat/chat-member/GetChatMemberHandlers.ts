import { ChatMemberValidator } from './ChatMemberValidator';
import { HandlerDecoratorBase, IHandler } from '../../types';
import { ChatMemberAccessPermission } from './ChatMemberAccessPermission';
import { ChatMember, Admin, Chat } from '@workquest/database-models/lib/models';

export interface GetChatMemberByAdminCommand {
  readonly chat: Chat;
  readonly admin: Admin;
}

export interface GetChatMemberByIdCommand {
  readonly chat: Chat;
  readonly id: string;
}

export interface GetChatMembersByAdminsCommand {
  readonly chat: Chat;
  readonly admins: Array<Admin>;
}

export interface GetChatMembersByIdsCommand {
  readonly chat: Chat;
  readonly ids: Array<string>;
}

export class GetChatMemberByAdminHandler implements IHandler<GetChatMemberByAdminCommand, Promise<ChatMember>> {
  public async Handle(command: GetChatMemberByAdminCommand): Promise<ChatMember> {
    return await ChatMember.scope('forGetChat').findOne({ where: { adminId: command.admin.id, chatId: command.chat.id } });
  }
}

export class GetChatMemberByIdHandler implements IHandler<GetChatMemberByIdCommand, Promise<ChatMember>> {
  public async Handle(command: GetChatMemberByIdCommand): Promise<ChatMember> {
    return await ChatMember.findOne({ where: { adminId: command.id, chatId: command.chat.id } });
  }
}

export class GetChatMembersByAdminsHandler implements IHandler<GetChatMembersByAdminsCommand, Promise<ChatMember[]>> {
  public async Handle(command: GetChatMembersByAdminsCommand): Promise<ChatMember[]> {
    return await ChatMember.findAll({ where: { adminId: command.admins.map(admin => admin.id), chatId: command.chat.id } });
  }
}

export class GetChatMembersByIdsHandler implements IHandler<GetChatMembersByIdsCommand, Promise<ChatMember[]>> {
  public async Handle(command: GetChatMembersByIdsCommand): Promise<ChatMember[]> {
    return await ChatMember.findAll({ where: { adminId: command.ids, chatId: command.chat.id } });
  }
}

export class GetChatMemberPostValidationHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember>> {

  private readonly validator: ChatMemberValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember>>,
  ) {
    super(decorated);

    this.validator = new ChatMemberValidator();
  }

  public async Handle(command: Tin): Promise<ChatMember> {
    const chatMember = await this.decorated.Handle(command);

    this.validator.NotNull(command.chat, chatMember);

    return chatMember;
  }
}

export class GetChatMemberPostFullAccessPermissionHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember>> {

  private readonly accessPermission: ChatMemberAccessPermission;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember>>,
  ) {
    super(decorated);

    this.accessPermission = new ChatMemberAccessPermission();
  }

  public async Handle(command: Tin): Promise<ChatMember> {
    const chatMember = await this.decorated.Handle(command);

    this.accessPermission.HasFullAccessOnChat(command.chat, chatMember);

    return chatMember;
  }
}

export class GetChatMemberPostLimitedAccessPermissionHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember>> {

  private readonly accessPermission: ChatMemberAccessPermission;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember>>,
  ) {
    super(decorated);

    this.accessPermission = new ChatMemberAccessPermission();
  }

  public async Handle(command: Tin): Promise<ChatMember> {
    const chatMember = await this.decorated.Handle(command);

    this.accessPermission.HasLimitedAccessOnChat(command.chat, chatMember);

    return chatMember;
  }
}

export class GetChatMembersPostValidationHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember[]>> {

  private readonly validator: ChatMemberValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember[]>>,
  ) {
    super(decorated);

    this.validator = new ChatMemberValidator();
  }

  public async Handle(command: Tin): Promise<ChatMember[]> {
    const chatMember = await this.decorated.Handle(command);

    // this.validator.NotNull(command.chat, chatMember);

    return chatMember;
  }
}

export class GetActiveChatMembersPostAccessPermissionHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember[]>> {

  private readonly accessPermission: ChatMemberAccessPermission;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember[]>>,
  ) {
    super(decorated);
  }

  public async Handle(command: Tin): Promise<ChatMember[]> {
    const chatMember = await this.decorated.Handle(command);

    // this.accessPermission.HasAccessOnChat();

    return chatMember;
  }
}
