import { PoolConfig, Pool } from 'pg';
import { Field, FieldImpl, Table, TableImpl, QueryFactory, Create } from '../src/model';
import sinon, { SinonStub } from 'sinon';

export class Person extends TableImpl {
  private static readonly _TABLE_NAME = 'person';
  static readonly ID: Field<number> = new FieldImpl<number>(Person._TABLE_NAME, 1, 'id', undefined, 'integer', false, true);
  static readonly FIRST_NAME: Field<string> = new FieldImpl<string>(Person._TABLE_NAME, 2, 'first_name', undefined, 'character varying', false, false);
  static readonly LAST_NAME: Field<string> = new FieldImpl<string>(Person._TABLE_NAME, 3, 'last_name', undefined, 'character varying', false, false);
  static readonly EMAIL: Field<string> = new FieldImpl<string>(Person._TABLE_NAME, 4, 'email', undefined, 'character varying', false, false);
  private static readonly _FIELDS: Field<any>[] = [Person.ID, Person.FIRST_NAME, Person.LAST_NAME, Person.EMAIL];

  constructor() {
    super(Person._TABLE_NAME, undefined, Person._FIELDS);
  }
}

export class Tables {
  static readonly PERSON: Table = new Person();
}

const config: PoolConfig = {
  host: '',
  port: 0,
  database: '',
  user: '',
  password: '',
};

const pool = new Pool(config);

export const useCreate = (): [Create, SinonStub, SinonStub] => {
  const create = QueryFactory.create(pool);
  const queryStub = sinon.stub(create, 'query').callsFake((queryString, params, callback) => {
    callback(undefined, {
      rows: [],
      command: '',
      rowCount: 0,
      oid: 1,
      fields: [],
    });
  });
  const executeStub = sinon.stub(create, 'executeInTransaction').callsFake(() => Promise.resolve());
  return [create, queryStub, executeStub];
};
