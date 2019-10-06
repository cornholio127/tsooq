import 'mocha';
import chai from 'chai';
import { Tables, Person, useCreate } from './setup';

describe.only('delete', () => {
  describe('simple delete', () => {
    it('should render correct sql', done => {
      const [create, _, stub] = useCreate();
      create
        .deleteFrom(Tables.PERSON)
        .execute()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'DELETE FROM person',
          );
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('delete with condition', () => {
    it('should render correct sql', done => {
      const [create, _, stub] = useCreate();
      create
        .deleteFrom(Tables.PERSON)
        .where(Person.ID.eq(5))
        .execute()
        .then(() => {
          chai.assert.equal(
            stub.getCall(0).args[0],
            'DELETE FROM person WHERE person.id = $1',
          );
          done();
        })
        .catch(err => done(err));
    });
  });
});
