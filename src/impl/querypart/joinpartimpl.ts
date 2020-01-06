import {
  JoinPart,
  QueryPart,
  Table,
  Condition,
  JoinConditionPart,
  SelectWherePart,
  SortField,
  OrderPart,
  Result,
  Database,
} from '../../model';
import WherePartImpl from './wherepartimpl';
import OrderPartImpl from './orderpartimpl';
import { Runnable } from '../../util';
import SelectFinalPartImpl from './selectfinalpartimpl';

class JoinConditionPartImpl extends SelectFinalPartImpl
  implements JoinConditionPart, QueryPart {
  private readonly cond: Condition;

  constructor(db: Database, parts: QueryPart[], cond: Condition) {
    super(db, parts);
    this.cond = cond;
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
