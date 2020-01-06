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
} from '../../model';
import OrderPartImpl from './orderpartimpl';
import { Runnable } from '../../util';
import GroupByPartImpl from './groupbypartimpl';
import { Database } from '../database';
import SelectFinalPartImpl from './selectfinalpartimpl';

class WherePartImpl extends SelectFinalPartImpl
  implements SelectWherePart, UpdateWherePart, DeleteWherePart, QueryPart {
  private readonly cond: Condition;

  constructor(db: Database, parts: QueryPart[], cond: Condition) {
    super(db, parts);
    this.cond = cond;
  }

  groupBy(...fields: FieldLike<unknown>[]) {
    return new GroupByPartImpl(this.db, this.parts, fields);
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
    return 'WHERE ' + this.cond.render(params);
  }
}

export default WherePartImpl;
