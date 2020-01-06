import { SortField, Order } from '../../model';

class SortFieldImpl<T> implements SortField<T> {
  constructor(private readonly name: string, readonly sort: Order) {}

  render() {
    return this.name;
  }
}

export default SortFieldImpl;
