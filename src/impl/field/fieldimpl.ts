import { Field, SortField, Order, FieldLike } from '../../model';
import MathExpression from './mathexpression';
import ComparableImpl from './comparableimpl';

class FieldImpl<T> extends ComparableImpl<T> implements Field<T>, SortField<T> {
  constructor(
    private readonly tableName: string,
    readonly ordinal: number,
    readonly name: string,
    readonly alias: string,
    readonly dataType: string,
    readonly isNullable: boolean,
    readonly hasDefault: boolean,
    readonly sort: Order = undefined
  ) {
    super();
  }

  render() {
    return `${this.tableName}.${this.name}`;
  }

  asc(): SortField<T> {
    return new FieldImpl<T>(
      this.tableName,
      this.ordinal,
      this.name,
      this.alias,
      this.dataType,
      this.isNullable,
      this.hasDefault,
      Order.ASC
    );
  }

  desc(): SortField<T> {
    return new FieldImpl<T>(
      this.tableName,
      this.ordinal,
      this.name,
      this.alias,
      this.dataType,
      this.isNullable,
      this.hasDefault,
      Order.DESC
    );
  }

  plus(value: number): FieldLike<number> {
    return new MathExpression(this, '+', value);
  }

  minus(value: number): FieldLike<number> {
    return new MathExpression(this, '-', value);
  }

  as(alias: string) {
    return new FieldImpl<T>(
      this.tableName,
      this.ordinal,
      this.name,
      alias,
      this.dataType,
      this.isNullable,
      this.hasDefault
    );
  }
}

export default FieldImpl;
