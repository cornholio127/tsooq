import { FieldLike } from '../../model';
import FieldLikeImpl from './fieldlikeimpl';

class DistinctOnImpl<T> extends FieldLikeImpl<T> {
  constructor(
    private readonly groupField: FieldLike<unknown>,
    private field: FieldLike<unknown>,
    alias?: string
  ) {
    super(alias);
  }
  as(alias: string) {
    return new DistinctOnImpl<T>(this.groupField, this.field, alias);
  }
  render() {
    return `DISTINCT ON (${this.groupField.render()}) ${this.field.render()}`;
  }
}

export default DistinctOnImpl;
