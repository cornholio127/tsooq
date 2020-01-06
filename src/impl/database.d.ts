import { QueryPart, Result, Record, Table, Field } from '../model';
import { Runnable } from '../util';
import { QueryResult } from 'pg';
import { Logger } from 'log4js';

export interface Database {
  toRunnable(parts: QueryPart[]): Runnable;
  execute(parts: QueryPart[]): Promise<Result<void>>;
  fetch<T>(
    parts: QueryPart[],
    mapper?: (record: Record) => T
  ): Promise<Record[] | T[]>;
  fetchSingle<T>(
    parts: QueryPart[],
    mapper?: (record: Record) => T
  ): Promise<Record | T>
  insert<T>(
    table: Table,
    fields: Field<unknown>[],
    values: unknown[],
    returning?: Field<T>
  ): Runnable<T>;
  executeInsert<T>(
    table: Table,
    fields: Field<unknown>[],
    values: unknown[],
    returning?: Field<T>
  ): Promise<Result<T>>;
  executeInTransaction<T = void>(
    query: string,
    params: unknown[],
    returning?: Field<T>
  ): Promise<Result<T>>;
  query(
    queryString: string,
    params: unknown[],
    callback: (err: Error, result: QueryResult<unknown>) => void
  ): void;
  transaction<T = void>(...runnables: Runnable<unknown>[]): Promise<T>;
  setLogger(logger: Logger): void;
}
