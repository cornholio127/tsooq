import 'mocha';
import chai from 'chai';
import { Tables, Person, useCreate, Address } from './setup';
import DbFunctions from '../src/impl/field/dbfunctions';
import { select } from '../src/impl/queryfactory';

describe.only('select', () => {
  describe('simple select', () => {
    it('should render correct sql', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID, Person.FIRST_NAME, Person.LAST_NAME, Person.EMAIL)
        .from(Tables.PERSON)
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id, person.first_name, person.last_name, person.email FROM person',
          );
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('select with where part', () => {
    it('eq', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.EMAIL.eq('email@domain.com'))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.email = $1',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('ne', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.EMAIL.ne('email@domain.com'))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.email != $1',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('is null', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.EMAIL.isNull())
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.email IS NULL',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('is not null', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.EMAIL.isNotNull())
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.email IS NOT NULL',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('lt', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.ID.lt(5))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.id < $1',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('lte', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.ID.lte(5))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.id <= $1',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('gt', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.ID.gt(5))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.id > $1',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('gte', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.ID.gte(5))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.id >= $1',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('in', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.ID.in([1, 3, 4]))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.id IN ($1, $2, $3)',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('like', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID)
        .from(Tables.PERSON)
        .where(Person.FIRST_NAME.like('%x%'))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id FROM person WHERE person.first_name LIKE $1',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('subquery', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.FIRST_NAME, Person.LAST_NAME)
        .from(Tables.PERSON)
        .where(Person.ADDRESS_ID.in(
          select(Address.ID)
            .from(Tables.ADDRESS)
            .where(Address.STREET.eq('Second Street'))))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.first_name, person.last_name FROM person WHERE person.address_id IN (SELECT address.id FROM address WHERE address.street = $1)',
          );
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('select with join', () => {
    it('should render correct sql', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.FIRST_NAME, Person.LAST_NAME, Address.STREET, Address.CITY)
        .from(Tables.PERSON)
        .leftOuterJoin(Tables.ADDRESS)
        .on(Person.ADDRESS_ID.eq(Address.ID))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.first_name, person.last_name, address.street, address.city FROM person LEFT OUTER JOIN address ON person.address_id = address.id',
          );
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('select with order', () => {
    it('ascending', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID, Person.FIRST_NAME, Person.LAST_NAME, Person.EMAIL)
        .from(Tables.PERSON)
        .orderBy(Person.FIRST_NAME.asc())
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id, person.first_name, person.last_name, person.email FROM person ORDER BY person.first_name ASC',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('descending', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.ID, Person.FIRST_NAME, Person.LAST_NAME, Person.EMAIL)
        .from(Tables.PERSON)
        .orderBy(Person.FIRST_NAME.desc())
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.id, person.first_name, person.last_name, person.email FROM person ORDER BY person.first_name DESC',
          );
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('select with grouping', () => {
    it('simple grouping', done => {
      const [create, stub] = useCreate();
      create
        .select(Person.FIRST_NAME)
        .from(Tables.PERSON)
        .groupBy(Person.FIRST_NAME)
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.first_name FROM person GROUP BY person.first_name',
          );
          done();
        })
        .catch(err => done(err));
    });

    it('having', done => {
      const [create, stub] = useCreate();
      const count = DbFunctions.count(Person.FIRST_NAME).as('count');
      create
        .select(Person.FIRST_NAME, count)
        .from(Tables.PERSON)
        .groupBy(Person.FIRST_NAME)
        .having(count.gt(1))
        .fetch()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'SELECT person.first_name, COUNT(person.first_name) AS "count" FROM person GROUP BY person.first_name HAVING COUNT(person.first_name) > $1',
          );
          done();
        })
        .catch(err => done(err));
    });
  });
});
