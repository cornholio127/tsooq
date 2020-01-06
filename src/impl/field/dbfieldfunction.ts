import { FieldLike } from '../../model';
import FieldLikeImpl from './fieldlikeimpl';

class DbFieldFunction<T> extends FieldLikeImpl<T> {
  constructor(
    private readonly func: string,
    private field: FieldLike<unknown>,
    alias?: string
  ) {
    super(alias);
  }
  as(alias: string) {
    return new DbFieldFunction<T>(this.func, this.field, alias);
  }
  render() {
    return `${this.func}(${this.field.render()})`;
  }
}

export default DbFieldFunction;
