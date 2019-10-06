import 'mocha';
import chai from 'chai';
import { Tables, Person, useCreate } from './setup';

describe.only('insert', () => {
  describe('simple insert', () => {
    it('should render correct sql', done => {
      const [create, _, stub] = useCreate();
      create
        .insertInto(Tables.PERSON, Person.FIRST_NAME, Person.LAST_NAME, Person.EMAIL)
        .values('First', 'Last', 'email@domain.com')
        .execute()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'INSERT INTO person (first_name, last_name, email) VALUES ($1, $2, $3)',
          );
          done();
        })
        .catch(err => done(err));
    });
  });
});
