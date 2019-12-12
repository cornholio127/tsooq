import { Pool, PoolClient, QueryResult } from 'pg';
import { Result, Field } from './model';

export type Runnable<T = void> = (client: PoolClient) => Promise<Result<T>>;

class ResultImpl<T> implements Result<T> {
  constructor(
    private readonly queryResult: QueryResult,
    private field: Field<T>,
  ) {}

  get value() {
    return this.queryResult.rows[0][this.field.name];
  }

  get values() {
    return this.queryResult.rows.map(row => row[this.field.name]);
  }

  get rowCount() {
    return this.queryResult.rowCount;
  }
}

class EmptyResult implements Result<void> {
  constructor(private readonly queryResult: QueryResult) {}

  get value(): any {
    return undefined;
  }

  get values(): any {
    return undefined;
  }

  get rowCount() {
    return this.queryResult.rowCount;
  }
}

class ConstantResult<T> implements Result<T> {
  constructor(private readonly result: T) {}

  get value(): T {
    return this.result;
  }

  get values(): T[] {
    return [this.result];
  }

  get rowCount() {
    return 1;
  }
}

export const resultOf = <T>(queryResult: QueryResult, field: Field<T>): Result<T> => new ResultImpl(queryResult, field);

export const emptyResult = <T>(queryResult: QueryResult): Result<T> => new EmptyResult(queryResult);

export const constantResult = <T>(result: T) => new ConstantResult<T>(result);

export const executeInTransaction = <T = void>(pool: Pool, runnable: Runnable<T>, returning?: Field<T>): Promise<Result<T>> => new Promise<Result<T>>((resolve, reject) => {
  pool.connect((err, client, done) => {
    if (err) {
      reject(err);
      return;
    }
    (async () => {
      try {
        await client.query('BEGIN');
        const result = await runnable(client);
        await client.query('COMMIT');
        resolve(result);
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        done();
      }
    })().catch(err => {
      reject(err);
    });
  });
});

export const runnable = <T = void>(queryString: string, params: any[], returning?: Field<T>): Runnable<T> =>
  (client: PoolClient) => new Promise<Result<T>>((resolve, reject) => {
    client.query(queryString, params)
      .then(result => resolve(returning ? resultOf(result, returning) : emptyResult(result)))
      .catch(reject);
  });
