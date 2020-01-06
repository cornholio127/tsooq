import { Logger } from 'log4js';
import { Pool, QueryResult, PoolClient } from 'pg';
import { Field, Table, Record, Result, QueryPart } from '../model';
import { Runnable, runnable, executeInTransaction } from '../util';
import RecordImpl from './recordimpl';
import { Database } from './database';

const formatParamsForLog = (params: unknown[]) =>
  params
    .map(p => '' + p)
    .map(p =>
      p != undefined && p.length > 15 ? p.substring(0, 12) + '...' : p
    )
    .join();

class DatabaseImpl implements Database {
  private logger: Logger;

  constructor(private readonly pool: Pool) {}

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  private log(msg: string): void {
    if (this.logger != undefined) {
      this.logger.trace(msg);
    }
  }

  private get canLog(): boolean {
    if (this.logger == undefined) {
      return false;
    }
    return this.logger.isTraceEnabled();
  }

  renderInsert(
    table: Table,
    fields: Field<unknown>[],
    values: unknown[],
    returning?: Field<unknown>
  ): [string, unknown[]] {
    const params: unknown[] = [];
    const fieldNames = fields
      .filter(field => field != undefined)
      .map(field => field.name);
    const renderedValues: string[] = [];
    for (let i = 0; i < fieldNames.length; i++) {
      params.push(values[i]);
      renderedValues.push('$' + params.length);
    }
    let query = `INSERT INTO ${table.name} (${fieldNames.join(
      ', '
    )}) VALUES (${renderedValues.join(', ')})`;
    if (returning != undefined) {
      query += ` RETURNING ${returning.name}`;
    }
    if (this.canLog) {
      this.log(query);
      this.log(formatParamsForLog(params));
    }
    return [query, params];
  }

  insert<T>(
    table: Table,
    fields: Field<unknown>[],
    values: unknown[],
    returning?: Field<T>
  ): Runnable<T> {
    const [query, params] = this.renderInsert(table, fields, values, returning);
    return runnable(query, params, returning);
  }

  executeInsert<T>(
    table: Table,
    fields: Field<unknown>[],
    values: unknown[],
    returning?: Field<T>
  ): Promise<Result<T>> {
    const [query, params] = this.renderInsert(table, fields, values, returning);
    return this.executeInTransaction(query, params, returning);
  }

  executeInTransaction<T = void>(
    query: string,
    params: unknown[],
    returning?: Field<T>
  ): Promise<Result<T>> {
    return executeInTransaction(
      this.pool,
      runnable(query, params, returning),
      returning
    );
  }

  query(
    queryString: string,
    params: unknown[],
    callback: (err: Error, result: QueryResult<unknown>) => void
  ) {
    this.pool.query(queryString, params, callback);
  }

  fetch<T>(
    parts: QueryPart[],
    mapper?: (record: Record) => T
  ): Promise<Record[] | T[]> {
    const params: unknown[] = [];
    const query = parts.map(part => part.render(params)).join(' ');
    if (this.canLog) {
      this.log(query);
      if (params.length > 0) {
        this.log(formatParamsForLog(params));
      }
    }
    return new Promise<Record[] | T[]>((resolve, reject) => {
      this.query(query, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const records = result.rows.map(
            row => new RecordImpl(row as { [index: string]: unknown })
          );
          if (mapper == undefined) {
            resolve(records);
          } else {
            resolve(records.map(mapper));
          }
        }
      });
    });
  }

  fetchSingle<T>(
    parts: QueryPart[],
    mapper?: (record: Record) => T
  ): Promise<Record | T> {
    const params: unknown[] = [];
    const query = parts.map(part => part.render(params)).join(' ');
    if (this.canLog) {
      this.log(query);
      if (params.length > 0) {
        this.log(formatParamsForLog(params));
      }
    }
    return new Promise<Record | T>((resolve, reject) => {
      this.query(query, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const records = result.rows.map(
            row => new RecordImpl(row as { [index: string]: unknown })
          );
          const single: Record = records.length === 1 ? records[0] : undefined;
          if (mapper == undefined || single == undefined) {
            resolve(single);
          } else {
            resolve(mapper(single));
          }
        }
      });
    });
  }

  renderQuery(parts: QueryPart[]): [string, unknown[]] {
    const params: unknown[] = [];
    const query = parts.map(part => part.render(params)).join(' ');
    if (this.canLog) {
      this.log(query);
      this.log(formatParamsForLog(params));
    }
    return [query, params];
  }

  toRunnable(parts: QueryPart[]): Runnable {
    const [query, params] = this.renderQuery(parts);
    return runnable(query, params);
  }

  execute(parts: QueryPart[]): Promise<Result<void>> {
    const [query, params] = this.renderQuery(parts);
    return this.executeInTransaction(query, params);
  }

  async transaction<T = void>(...runnables: Runnable<unknown>[]): Promise<T> {
    const result = await executeInTransaction(
      this.pool,
      async (client: PoolClient) => {
        let lastResult;
        for (let i = 0; i < runnables.length; i++) {
          lastResult = await runnables[i](client);
        }
        return lastResult;
      }
    );
    return (result.value as unknown) as T;
  }
}

export default DatabaseImpl;
