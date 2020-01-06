import {
  JoinPart,
  QueryPart,
  Table,
  Condition,
  JoinConditionPart,
  SelectWherePart,
  SortField,
  OrderPart,
  Mapper,
  Result,
  Record,
} from '../../model';
import { Database } from '../database';
import WherePartImpl from './wherepartimpl';
import OrderPartImpl from './orderpartimpl';
import { Runnable } from '../../util';

class JoinConditionPartImpl implements JoinConditionPart, QueryPart {
  private readonly db: Database;
  private readonly cond: Condition;
  private readonly parts: QueryPart[];

  constructor(db: Database, parts: QueryPart[], cond: Condition) {
    this.db = db;
    this.cond = cond;
    this.parts = parts.concat(this);
  }

  join(table: Table) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new JoinPartImpl(this.db, this.parts, table);
  }

  leftOuterJoin(table: Table) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new LeftOuterJoinPartImpl(this.db, this.parts, table);
  }

  where(cond: Condition): SelectWherePart {
    return new WherePartImpl(this.db, this.parts, cond);
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
    return 'ON ' + this.cond.render(params);
  }
}

class JoinPartImpl implements JoinPart, QueryPart {
  private readonly db: Database;
  private readonly table: Table;
  private readonly parts: QueryPart[];

  constructor(db: Database, parts: QueryPart[], table: Table) {
    this.db = db;
    this.table = table;
    this.parts = parts.concat(this);
  }

  on(cond: Condition) {
    return new JoinConditionPartImpl(this.db, this.parts, cond);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    return 'JOIN ' + this.table.name;
  }
}

export class LeftOuterJoinPartImpl extends JoinPartImpl {
  render(params: unknown[]) {
    return 'LEFT OUTER ' + super.render(params);
  }
}

export default JoinPartImpl;
