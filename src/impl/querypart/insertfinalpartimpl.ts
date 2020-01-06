import { InsertFinalPart, Table, Field } from '../../model';
import { Database } from '../database';

class InsertFinalPartImpl<T> implements InsertFinalPart<T> {
  constructor(
    private readonly create: Database,
    private readonly table: Table,
    private readonly fields: Field<unknown>[],
    private readonly values: unknown[],
    private readonly returning: Field<T>
  ) {}

  execute() {
    return this.create.executeInsert(
      this.table,
      this.fields,
      this.values,
      this.returning
    );
  }

  runnable() {
    return this.create.insert(
      this.table,
      this.fields,
      this.values,
      this.returning
    );
  }
}

export default InsertFinalPartImpl;
