import { PoolConfig, Pool } from 'pg';
import { Field, Table, Create } from '../src/model';
import TableImpl from '../src/impl/tableimpl';
import FieldImpl from '../src/impl/field/fieldimpl';
import QueryFactory from '../src/impl/queryfactory';
import sinon, { SinonStub } from 'sinon';

export class Person extends TableImpl {
  private static readonly _TABLE_NAME = 'person';
  static readonly ID: Field<number> = new FieldImpl<number>(Person._TABLE_NAME, 1, 'id', undefined, 'integer', false, true);
  static readonly FIRST_NAME: Field<string> = new FieldImpl<string>(Person._TABLE_NAME, 2, 'first_name', undefined, 'character varying', false, false);
  static readonly LAST_NAME: Field<string> = new FieldImpl<string>(Person._TABLE_NAME, 3, 'last_name', undefined, 'character varying', false, false);
  static readonly EMAIL: Field<string> = new FieldImpl<string>(Person._TABLE_NAME, 4, 'email', undefined, 'character varying', false, false);
  static readonly ADDRESS_ID: Field<number> = new FieldImpl<number>(Person._TABLE_NAME, 5, 'address_id', undefined, 'integer', true, false);
  private static readonly _FIELDS: Field<any>[] = [Person.ID, Person.FIRST_NAME, Person.LAST_NAME, Person.EMAIL, Person.ADDRESS_ID];

  constructor() {
    super(Person._TABLE_NAME, undefined, Person._FIELDS);
  }
}

export class Address extends TableImpl {
  private static readonly _TABLE_NAME = 'address';
  static readonly ID: Field<number> = new FieldImpl<number>(Address._TABLE_NAME, 1, 'id', undefined, 'integer', false, true);
  static readonly STREET: Field<string> = new FieldImpl<string>(Address._TABLE_NAME, 2, 'street', undefined, 'character varying', false, false);
  static readonly CITY: Field<string> = new FieldImpl<string>(Address._TABLE_NAME, 3, 'city', undefined, 'character varying', false, false);
  private static readonly _FIELDS: Field<any>[] = [Address.ID, Address.STREET, Address.CITY];

  constructor() {
    super(Address._TABLE_NAME, undefined, Address._FIELDS);
  }
}

export class Tables {
  static readonly PERSON: Table = new Person();
  static readonly ADDRESS: Table = new Address();
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
  const queryStub = sinon.stub(create.getDb(), 'query').callsFake((queryString, params, callback) => {
    callback(undefined, {
      rows: [],
      command: '',
      rowCount: 0,
      oid: 1,
      fields: [],
    });
  });
  const executeStub = sinon.stub(create.getDb(), 'executeInTransaction').callsFake(() => Promise.resolve() as any);
  return [create, queryStub, executeStub];
};
