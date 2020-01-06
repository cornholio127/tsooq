import { Database, Field, Table, UpdatePart, QueryPart } from '../../model';
import AssignFieldPartImpl from './assignfieldpartimpl';

class UpdatePartImpl implements UpdatePart, QueryPart {
  private readonly db: Database;
  private readonly table: Table;
  private readonly parts: QueryPart[];

  constructor(db: Database, table: Table) {
    this.db = db;
    this.table = table;
    this.parts = [this];
  }

  set<T>(field: Field<T>, value: T) {
    return new AssignFieldPartImpl(this.db, this.parts, field, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    return 'UPDATE ' + this.table.name;
  }
}

export default UpdatePartImpl;
