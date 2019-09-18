import { Pool, PoolConfig, QueryResult, PoolClient } from 'pg';

export type Runnable = (client: PoolClient) => void;

export interface Result<T> {
  value: T;
  values: T[];
  rowCount: number;
}

export type Runnable2<T> = (client: PoolClient) => Promise<Result<T>>;

export const transaction2: (pool: Pool, runnable: Runnable) => Promise<void> = (pool, runnable) => new Promise<void>((resolve, reject) => {
  pool.connect((err, client, done) => {
    if (err) {
      reject(err);
      return;
    }
    (async () => {
      try {
        await client.query('BEGIN');
        await runnable(client);
        await client.query('COMMIT');
        resolve();
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

export const runnable: (queryString: string, params: any[]) => Runnable = (queryString, params) => async function(client: PoolClient) {
  await client.query(queryString, params);
};
