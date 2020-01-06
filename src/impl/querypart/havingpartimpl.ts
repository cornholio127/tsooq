import {
  HavingPart,
  QueryPart,
  Condition,
  SortField,
  OrderPart,
} from '../../model';
import OrderPartImpl from './orderpartimpl';
import { Database } from '../database';
import SelectFinalPartImpl from './selectfinalpartimpl';

class HavingPartImpl extends SelectFinalPartImpl
  implements HavingPart, QueryPart {
  private readonly cond: Condition;

  constructor(db: Database, parts: QueryPart[], cond: Condition) {
    super(db, parts);
    this.cond = cond;
  }

  orderBy(field: SortField<unknown>): OrderPart {
    return new OrderPartImpl(this.db, this.parts, field);
  }

  render(params: unknown[]): string {
    return `HAVING ${this.cond.render(params)}`;
  }
}

export default HavingPartImpl;
