import { GroupChatValidator } from './GroupChatValidator';
import { Options, HandlerDecoratorBase, IHandler } from '../../types';
import { GroupChatAccessPermission } from './GroupChatAccessPermission';
import {
  Chat,
  Message,
  ChatMember,
  InfoMessage,
  MessageType,
  MemberStatus,
  MessageAction,
  ChatMemberDeletionData,
  ReasonForRemovingFromChat,
} from '@workquest/database-models/lib/models';

export interface DeleteMemberFromGroupChatCommand {
  readonly groupChat: Chat;
  readonly member: ChatMember;
  readonly deletionInitiator: ChatMember;
}

interface DeleteMemberPayload extends DeleteMemberFromGroupChatCommand {
  readonly lastMessage: Message;
}

export class DeletedMemberFromGroupChatHandler implements IHandler<DeleteMemberFromGroupChatCommand, Promise<Message>> {
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  private static async deleteMember(payload: DeleteMemberPayload, options: Options = {}): Promise<[deletedMember: ChatMember, deletionData: ChatMemberDeletionData]> {
    const chatMemberDeletionData = ChatMemberDeletionData.build({
      chatMemberId: payload.member.id,
      beforeDeletionMessageId: payload.lastMessage?.id,
      reason: ReasonForRemovingFromChat.Removed,
      beforeDeletionMessageNumber: payload.lastMessage?.number,
    });

    return Promise.all([
      payload.member.update({ status: MemberStatus.Deleted }, { transaction: options.tx }),
      chatMemberDeletionData.save({ transaction: options.tx }),
    ]);
  }

  private static async sendInfoMessageAboutDeleteMember(payload: DeleteMemberPayload, options: Options = {}): Promise<Message> {
    const message = Message.build({
      number: payload.lastMessage.number + 1,
      chatId: payload.groupChat.id,
      senderMemberId: payload.deletionInitiator.id,
      type: MessageType.Info,
    });

    const info = InfoMessage.build({
      messageId: message.id,
      memberId: payload.member.id,
      messageAction: MessageAction.GroupChatDeleteMember,
    });

    await Promise.all([
      message.save({ transaction: options.tx }),
      info.save({ transaction: options.tx }),
    ]);

    message.setDataValue('infoMessage', info);

    return message;
  }

  public async Handle(command: DeleteMemberFromGroupChatCommand): Promise<Message> {
    const [[deletedMember, deletionData], infoMessage] = await this.dbContext.transaction(async (tx) => {
      const lastMessage = await DeletedMemberFromGroupChatHandler.getLastMessage(command.groupChat, { tx });

      const payload = { ...command, lastMessage };

      return await Promise.all([
        DeletedMemberFromGroupChatHandler.deleteMember(payload, { tx }),
        DeletedMemberFromGroupChatHandler.sendInfoMessageAboutDeleteMember(payload, { tx }),
      ]);
    });

    return infoMessage;
  }
}

export class DeletedMemberFromGroupChatPreAccessPermissionHandler extends HandlerDecoratorBase<DeleteMemberFromGroupChatCommand, Promise<Message>> {

  private readonly accessPermission: GroupChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<DeleteMemberFromGroupChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.accessPermission = new GroupChatAccessPermission();
  }

  public async Handle(command: DeleteMemberFromGroupChatCommand): Promise<Message> {
    this.accessPermission.MemberHasAccess(command.groupChat, command.member);
    this.accessPermission.MemberHasOwnerAccess(command.groupChat, command.deletionInitiator);

    return this.decorated.Handle(command);
  }
}

export class DeletedMemberFromGroupChatPreValidateHandler extends HandlerDecoratorBase<DeleteMemberFromGroupChatCommand, Promise<Message>> {

  private readonly validator: GroupChatValidator;

  constructor(
    protected readonly decorated: IHandler<DeleteMemberFromGroupChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.validator = new GroupChatValidator();
  }

  public async Handle(command: DeleteMemberFromGroupChatCommand): Promise<Message> {
    this.validator.GroupChatValidate(command.groupChat);
    this.validator.NotChatOwnerValidate(command.groupChat, command.member);

    return this.decorated.Handle(command);
  }
}
