import {
  Result,
  SelectWherePart,
  UpdateWherePart,
  DeleteWherePart,
  QueryPart,
  Condition,
  FieldLike,
  SortField,
  OrderPart,
  Mapper,
  Record,
} from '../../model';
import OrderPartImpl from './orderpartimpl';
import { Runnable } from '../../util';
import GroupByPartImpl from './groupbypartimpl';
import { Database } from '../database';

class WherePartImpl
  implements SelectWherePart, UpdateWherePart, DeleteWherePart, QueryPart {
  private readonly db: Database;
  private readonly cond: Condition;
  private readonly parts: QueryPart[];

  constructor(db: Database, parts: QueryPart[], cond: Condition) {
    this.db = db;
    this.cond = cond;
    this.parts = parts.concat(this);
  }

  groupBy(...fields: FieldLike<unknown>[]) {
    return new GroupByPartImpl(this.db, this.parts, fields);
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

  runnable(): Runnable {
    return this.db.toRunnable(this.parts);
  }

  execute(): Promise<Result<void>> {
    return this.db.execute(this.parts);
  }

  render(params: unknown[]) {
    return 'WHERE ' + this.cond.render(params);
  }
}

export default WherePartImpl;
