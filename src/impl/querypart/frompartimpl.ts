import {
  FromPart,
  QueryPart,
  Table,
  Condition,
  SelectWherePart,
  FieldLike,
  SortField,
} from '../../model';
import JoinPartImpl, { LeftOuterJoinPartImpl } from './joinpartimpl';
import WherePartImpl from './wherepartimpl';
import GroupByPartImpl from './groupbypartimpl';
import OrderPartImpl from './orderpartimpl';
import { Database } from '../database';
import SelectFinalPartImpl from './selectfinalpartimpl';

class FromPartImpl extends SelectFinalPartImpl implements FromPart, QueryPart {
  private readonly table: Table;

  constructor(db: Database, parts: QueryPart[], table: Table) {
    super(db, parts);
    this.table = table;
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    return 'FROM ' + this.table.name;
  }
}

export default FromPartImpl;
