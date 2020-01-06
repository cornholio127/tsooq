import { OrderPart, QueryPart, SortField, Order } from '../../model';
import { Database } from '../database';
import SelectFinalPartImpl from './selectfinalpartimpl';

class OrderPartImpl extends SelectFinalPartImpl
  implements OrderPart, QueryPart {
  private readonly orderBy: SortField<unknown>;

  constructor(db: Database, parts: QueryPart[], orderBy: SortField<unknown>) {
    super(db, parts);
    this.orderBy = orderBy;
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
