import {
  InsertValuesPart,
  InsertIntoPart1,
  InsertIntoPart2,
  InsertIntoPart3,
  InsertIntoPart4,
  InsertIntoPart5,
  InsertIntoPart6,
  InsertIntoPart7,
  InsertIntoPart8,
  InsertIntoPart9,
  InsertIntoPart10,
  Table,
  Field,
} from '../../model';
import InsertValuesPartImpl from './insertvaluespartimpl';
import { Database } from '../database';

class InsertIntoPartImpl
  implements
    InsertIntoPart1<unknown>,
    InsertIntoPart2<unknown, unknown>,
    InsertIntoPart3<unknown, unknown, unknown>,
    InsertIntoPart4<unknown, unknown, unknown, unknown>,
    InsertIntoPart5<unknown, unknown, unknown, unknown, unknown>,
    InsertIntoPart6<unknown, unknown, unknown, unknown, unknown, unknown>,
    InsertIntoPart7<
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown
    >,
    InsertIntoPart8<
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown
    >,
    InsertIntoPart9<
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown
    >,
    InsertIntoPart10<
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown
    > {
  constructor(
    private readonly db: Database,
    private readonly table: Table,
    private readonly fields: Field<unknown>[]
  ) {}

  values(
    v1: unknown,
    v2?: unknown,
    v3?: unknown,
    v4?: unknown,
    v5?: unknown,
    v6?: unknown,
    v7?: unknown,
    v8?: unknown,
    v9?: unknown,
    v10?: unknown
  ): InsertValuesPart {
    return new InsertValuesPartImpl(this.db, this.table, this.fields, [
      v1,
      v2,
      v3,
      v4,
      v5,
      v6,
      v7,
      v8,
      v9,
      v10,
    ]);
  }
}

export default InsertIntoPartImpl;
