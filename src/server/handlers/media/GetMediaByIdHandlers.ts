import { HandlerDecoratorBase, IHandler } from "../types";
import { Chat, ChatMember, Media } from "@workquest/database-models/lib/models";
import { MediaValidator } from "./MediaValidator";

export interface GetMediaByIdCommand {
  readonly mediaId: string;
}

export interface GetMediaByIdsCommand {
  readonly mediaIds: Array<string>;
}

export class GetMediaByIdHandler implements IHandler<GetMediaByIdCommand, Promise<Media>> {
  public Handle(command: GetMediaByIdCommand): Promise<Media> {
    return Media.findByPk(command.mediaId);
  }
}

export class GetMediaByIdsHandler implements IHandler<GetMediaByIdsCommand, Promise<Media[]>>{
  public Handle(command: GetMediaByIdsCommand): Promise<Media[]> {
    return Media.findAll({ where: { id: command.mediaIds } });
  }
}

export class GetMediaPostValidationHandler<Tin extends { mediaId: string }> extends HandlerDecoratorBase<Tin, Promise<Media>> {
  private readonly validator: MediaValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<Media>>,
  ) {
    super(decorated);

    this.validator = new MediaValidator();
  }

  public async Handle(command: Tin): Promise<Media> {
    const media = await this.decorated.Handle(command);

    await this.validator.MediaMustExists(media);

    return media;
  }
}

export class GetMediasPostValidationHandler<Tin extends { mediaIds: ReadonlyArray<string> }> extends HandlerDecoratorBase<Tin, Promise<Media[]>> {

  private readonly validator: MediaValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<Media[]>>,
  ) {
    super(decorated);

    this.validator = new MediaValidator();
  }

  public async Handle(command: Tin): Promise<Media[]> {
    const medias = await this.decorated.Handle(command);

    for (const media of medias) {
      await this.validator.MediaMustExists(media);
    }

    return medias;
  }
}
