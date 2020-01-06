import {
  GroupByPart,
  QueryPart,
  FieldLike,
  SortField,
  OrderPart,
  Condition,
  HavingPart,
} from '../../model';
import OrderPartImpl from './orderpartimpl';
import HavingPartImpl from './havingpartimpl';
import { Database } from '../database';
import SelectFinalPartImpl from './selectfinalpartimpl';

class GroupByPartImpl extends SelectFinalPartImpl
  implements GroupByPart, QueryPart {
  private readonly fields: FieldLike<unknown>[];

  constructor(db: Database, parts: QueryPart[], fields: FieldLike<unknown>[]) {
    super(db, parts);
    this.fields = fields;
  }

  orderBy(field: SortField<unknown>): OrderPart {
    return new OrderPartImpl(this.db, this.parts, field);
  }

  having(cond: Condition): HavingPart {
    return new HavingPartImpl(this.db, this.parts, cond);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    return `GROUP BY ${this.fields.map(field => field.render()).join(', ')}`;
  }
}

export default GroupByPartImpl;
