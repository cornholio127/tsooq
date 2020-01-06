import { FieldLike, Order } from '../../model';
import ComparableImpl from './comparableimpl';
import SortFieldImpl from './sortfieldimpl';

abstract class FieldLikeImpl<T> extends ComparableImpl<T>
  implements FieldLike<T> {
  constructor(readonly alias: string) {
    super();
  }
  get name() {
    return this.render();
  }
  abstract as(alias: string): FieldLike<T>;
  asc() {
    return new SortFieldImpl<T>(
      this.alias == undefined ? this.render() : this.alias,
      Order.ASC
    );
  }
  desc() {
    return new SortFieldImpl<T>(
      this.alias == undefined ? this.render() : this.alias,
      Order.DESC
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  plus(value: number): FieldLike<number> {
    throw new Error('not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  minus(value: number): FieldLike<number> {
    throw new Error('not implemented');
  }
  abstract render(): string;
}

export default FieldLikeImpl;
