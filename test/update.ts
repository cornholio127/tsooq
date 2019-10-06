import 'mocha';
import chai from 'chai';
import { Tables, Person, useCreate } from './setup';

describe.only('update', () => {
  describe('simple update', () => {
    it('should render correct sql', done => {
      const [create, _, stub] = useCreate();
      create
        .update(Tables.PERSON)
        .set(Person.FIRST_NAME, 'First')
        .execute()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'UPDATE person SET first_name=$1',
          );
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('update with condition', () => {
    it('should render correct sql', done => {
      const [create, _, stub] = useCreate();
      create
        .update(Tables.PERSON)
        .set(Person.FIRST_NAME, 'First')
        .set(Person.LAST_NAME, 'Last')
        .where(Person.ID.eq(5))
        .execute()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'UPDATE person SET first_name=$1, last_name=$2 WHERE person.id = $3',
          );
          done();
        })
        .catch(err => done(err));
    });
  });
});
