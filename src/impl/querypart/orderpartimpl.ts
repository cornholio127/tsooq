import {
  Mapper,
  OrderPart,
  QueryPart,
  SortField,
  Order,
  Record,
} from '../../model';
import { Database } from '../database';

class OrderPartImpl implements OrderPart, QueryPart {
  private readonly db: Database;
  private readonly orderBy: SortField<unknown>;
  private readonly parts: QueryPart[];

  constructor(db: Database, parts: QueryPart[], orderBy: SortField<unknown>) {
    this.db = db;
    this.orderBy = orderBy;
    this.parts = parts.concat(this);
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
    const dir =
      this.orderBy.sort === Order.ASC
        ? ' ASC'
        : this.orderBy.sort === Order.DESC
        ? ' DESC'
        : '';
    return 'ORDER BY ' + this.orderBy.render() + dir;
  }
}

export default OrderPartImpl;
