import { Table, Field } from '../model';

export class TableImpl implements Table {
  constructor(
    readonly name: string,
    readonly alias: string,
    readonly fields: Field<unknown>[]
  ) {}

  as(alias: string) {
    return new TableImpl(this.name, alias, this.fields);
  }
}

export default TableImpl;
