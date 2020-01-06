import {
  DeleteFromPart,
  QueryPart,
  Table,
  DeleteWherePart,
  Condition,
  Result,
  Database,
} from '../../model';
import { Runnable } from '../../util';
import WherePartImpl from './wherepartimpl';

class DeleteFromPartImpl implements DeleteFromPart, QueryPart {
  private readonly db: Database;
  private readonly table: Table;
  private readonly parts: QueryPart[];

  constructor(db: Database, table: Table) {
    this.db = db;
    this.table = table;
    this.parts = [this];
  }

  where(cond: Condition): DeleteWherePart {
    return new WherePartImpl(this.db, this.parts, cond);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]): string {
    return `DELETE FROM ${this.table.name}`;
  }

  runnable(): Runnable {
    return this.db.toRunnable(this.parts);
  }

  execute(): Promise<Result<void>> {
    return this.db.execute(this.parts);
  }
}

export default DeleteFromPartImpl;
