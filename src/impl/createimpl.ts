import { Logger } from 'log4js';
import { Pool } from 'pg';
import {
  Create,
  Field,
  SelectPart,
  UpdatePart,
  Table,
  DeleteFromPart,
} from '../model';
import SelectPartImpl from './querypart/selectpartimpl';
import UpdatePartImpl from './querypart/updatepartimpl';
import InsertIntoPartImpl from './querypart/insertintopartimpl';
import DeleteFromPartImpl from './querypart/deletefrompartimpl';
import { Database } from './database';
import DatabaseImpl from './databaseimpl';
import { Runnable } from '../util';

class CreateImpl implements Create {
  private db: Database;

  constructor(pool: Pool) {
    this.db = new DatabaseImpl(pool);
  }

  setLogger(logger: Logger): void {
    this.db.setLogger(logger);
  }

  select(...fields: Field<unknown>[]): SelectPart {
    return new SelectPartImpl(this.db, fields);
  }

  update(table: Table): UpdatePart {
    return new UpdatePartImpl(this.db, table);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertInto(table: Table, ...fields: Field<unknown>[]): any {
    return new InsertIntoPartImpl(this.db, table, fields);
  }

  deleteFrom(table: Table): DeleteFromPart {
    return new DeleteFromPartImpl(this.db, table);
  }

  getDb(): Database {
    return this.db;
  }

  transaction<T = void>(...runnables: Runnable<unknown>[]): Promise<T> {
    return this.db.transaction(...runnables);
  }
}

export default CreateImpl;
