import { Transaction } from 'sequelize';
export interface Options {
  tx?: Transaction;
}
export interface IHandler<TIn, TOut> {
  Handle(input: TIn): TOut;
}
export abstract class BaseDomainHandler<TIn, TOut> implements IHandler<TIn, TOut> {
  protected constructor(
    protected readonly options: Options,
  ) {
  }
  public abstract Handle(input: TIn): TOut;
}
export abstract class BaseCompositeHandler<TIn, TOut> implements IHandler<TIn, TOut> {
  protected constructor(
    protected readonly dbContext: any,
  ) {
  }
  public abstract Handle(input: TIn): TOut;
}
export abstract class HandlerDecoratorBase<TIn, TOut> implements IHandler<TIn, TOut> {
  protected constructor(
    protected readonly decorated: IHandler<TIn, TOut>
  ) {
  }
  public abstract Handle(input: TIn): TOut;
}
