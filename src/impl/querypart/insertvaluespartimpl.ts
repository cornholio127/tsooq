import { Database, Field, InsertValuesPart, Table, Result } from '../../model';
import InsertFinalPartImpl from './insertfinalpartimpl';

class InsertValuesPartImpl implements InsertValuesPart {
  constructor(
    private readonly db: Database,
    private readonly table: Table,
    private readonly fields: Field<unknown>[],
    private readonly values: unknown[]
  ) {}

  execute() {
    return this.db.executeInsert(
      this.table,
      this.fields,
      this.values
    ) as Promise<Result<void>>;
  }

  runnable() {
    return this.db.insert(this.table, this.fields, this.values);
  }

  returning<T>(field: Field<T>) {
    return new InsertFinalPartImpl<T>(
      this.db,
      this.table,
      this.fields,
      this.values,
      field
    );
  }
}

export default InsertValuesPartImpl;
