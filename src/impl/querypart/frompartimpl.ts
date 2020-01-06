import {
  Mapper,
  FromPart,
  QueryPart,
  Table,
  Condition,
  SelectWherePart,
  FieldLike,
  SortField,
  Record,
} from '../../model';
import JoinPartImpl, { LeftOuterJoinPartImpl } from './joinpartimpl';
import WherePartImpl from './wherepartimpl';
import GroupByPartImpl from './groupbypartimpl';
import OrderPartImpl from './orderpartimpl';
import { Database } from '../database';

class FromPartImpl implements FromPart, QueryPart {
  private readonly db: Database;
  private readonly table: Table;
  private readonly parts: QueryPart[];

  constructor(db: Database, parts: QueryPart[], table: Table) {
    this.db = db;
    this.table = table;
    this.parts = parts.concat(this);
  }

  join(table: Table) {
    return new JoinPartImpl(this.db, this.parts, table);
  }

  leftOuterJoin(table: Table) {
    return new LeftOuterJoinPartImpl(this.db, this.parts, table);
  }

  where(cond: Condition): SelectWherePart {
    return new WherePartImpl(this.db, this.parts, cond);
  }

  groupBy(...fields: FieldLike<unknown>[]) {
    return new GroupByPartImpl(this.db, this.parts, fields);
  }

  orderBy(field: SortField<unknown>) {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    return 'FROM ' + this.table.name;
  }
}

export default FromPartImpl;
