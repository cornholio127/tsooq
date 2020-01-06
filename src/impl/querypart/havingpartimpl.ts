import {
  Mapper,
  HavingPart,
  QueryPart,
  Condition,
  SortField,
  OrderPart,
  Record,
} from '../../model';
import OrderPartImpl from './orderpartimpl';
import { Database } from '../database';

class HavingPartImpl implements HavingPart, QueryPart {
  private readonly db: Database;
  private readonly cond: Condition;
  private readonly parts: QueryPart[];

  constructor(db: Database, parts: QueryPart[], cond: Condition) {
    this.db = db;
    this.cond = cond;
    this.parts = parts.concat(this);
  }

  orderBy(field: SortField<unknown>): OrderPart {
    return new OrderPartImpl(this.db, this.parts, field);
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

  render(params: unknown[]): string {
    return `HAVING ${this.cond.render(params)}`;
  }
}

export default HavingPartImpl;
