import { Pool } from 'pg';
import { Field, Create, FieldLike, SelectPart } from '../model';
import CreateImpl from './createimpl';
import SelectPartImpl from './querypart/selectpartimpl';

class QueryFactory {
  static create(pool: Pool): Create {
    return new CreateImpl(pool);
  }
}

export const select: (...fields: FieldLike<unknown>[]) => SelectPart = (
  ...fields: Field<unknown>[]
) => new SelectPartImpl(undefined, fields);

export default QueryFactory;
