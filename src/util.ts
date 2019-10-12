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
  get value(): any {
    return undefined;
  }

  get values(): any {
    return undefined;
  }

  get rowCount() {
    return 0;
  }
}

export const resultOf = <T>(queryResult: QueryResult, field: Field<T>): Result<T> => new ResultImpl(queryResult, field);

export const emptyResult = (): Result<void> => new EmptyResult();

export type Runnable2<T> = (client: PoolClient) => Promise<Result<T>>;

export const transaction2 = <T = void>(pool: Pool, runnable: Runnable<T>, returning?: Field<T>): Promise<Result<T>> => new Promise<Result<T>>((resolve, reject) => {
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
      .then(result => resolve(returning ? resultOf(result, returning) : emptyResult() as any))
      .catch(reject);
  });
