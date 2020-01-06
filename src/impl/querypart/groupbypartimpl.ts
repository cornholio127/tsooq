import {
  Mapper,
  GroupByPart,
  QueryPart,
  FieldLike,
  SortField,
  OrderPart,
  Condition,
  HavingPart,
  Record,
} from '../../model';
import OrderPartImpl from './orderpartimpl';
import HavingPartImpl from './havingpartimpl';
import { Database } from '../database';

class GroupByPartImpl implements GroupByPart, QueryPart {
  private readonly db: Database;
  private readonly fields: FieldLike<unknown>[];
  private readonly parts: QueryPart[];

  constructor(db: Database, parts: QueryPart[], fields: FieldLike<unknown>[]) {
    this.db = db;
    this.fields = fields;
    this.parts = parts.concat(this);
  }

  orderBy(field: SortField<unknown>): OrderPart {
    return new OrderPartImpl(this.db, this.parts, field);
  }

  having(cond: Condition): HavingPart {
    return new HavingPartImpl(this.db, this.parts, cond);
  }

  fetch() {
    return this.db.fetch(this.parts) as Promise<Record[]>;
  }

  fetchSingle() {
    return this.db.fetchSingle(this.parts) as Promise<Record>;
  }

  fetchMapped<T>(mapper: Mapper<T>) {
    return this.db.fetch(this.parts, mapper) as Promise<T[]>;
  }

  fetchSingleMapped<T>(mapper: Mapper<T>) {
    return this.db.fetchSingle(this.parts, mapper) as Promise<T>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    return `GROUP BY ${this.fields.map(field => field.render()).join(', ')}`;
  }
}

export default GroupByPartImpl;
