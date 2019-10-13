[![NPM version](https://img.shields.io/npm/v/tsooq.svg?style=flat)](https://www.npmjs.com/package/tsooq)

# tsOOQ

TypeScript Object Oriented Querying

tsOOQ lets you write queries for a PostgreSQL in a typesafe fluent manner in TypeScript. It's not on OR-mapper. It's just SQL with language support. 

Plain SQL:
```sql
SELECT person.first_name, person.last_name, address.street, address.city 
FROM person 
LEFT OUTER JOIN address ON person.address_id = address.id 
WHERE address.city = 'London'
```

Same query using tsOOQ:
```javascript
create
  .select(Person.FIRST_NAME, Person.LAST_NAME, Address.STREET, Address.CITY)
  .from(Tables.PERSON)
  .leftOuterJoin(Tables.ADDRESS)
  .on(Person.ADDRESS_ID.eq(Address.ID))
  .where(Address.city.eq('London'))
  .fetch();
```

## Requirements
- Docker (for generating the metamodel with tsooq-gen)

## Getting started
Install `tsooq` and `tsooq-gen` using npm.
```
npm install tsooq --save
npm install tsooq-gen --save-dev
```
Put you DDL file somewhere into you project, e.g. `database/init.sql`.

Create a file called `.tsooq.json` in the root of your project.
```json
{
  "ddlScript": "database/init.sql",
  "outputDir": "src/gen",
  "schemaName": "public"
}
```
Add the following line to the `scripts`-section of `package.json`:
```json
"gen": "tsooq-gen"
```
Run the metamodel generator.
```
npm run gen
```
This creates a docker container with PostgreSQL and runs the DDL script. After 
it retrieves the metadata from the database and generates the metamodel. In the
example above the generated file will be `src/gen/public.ts` ("public" beeing 
the schema name).

Now set up the database connection factory.
```javascript
import { PoolConfig, Pool } from 'pg';
import { QueryFactory } from 'tsooq';

const config: PoolConfig = {
  host: 'localhost',
  port: 5432,
  database: 'example',
  user: 'example',
  password: 'password',
};

const pool = new Pool(config);

export const create = QueryFactory.create(pool);
```
That's it! Now you can start writing queries using tsOOQ!
```javascript
export const add = (dto: PersonDto): Promise<void> => {
  return create
    .insertInto(Tables.PERSON, Person.FIRST_NAME, Person.LAST_NAME, Person.EMAIL)
    .values(dto.firstName, dto.lastName, dto.email)
    .execute();
};

export const getById = (id: number): Promise<PersonDto> => {
  return create
    .select(Person.ID, Person.FIRST_NAME, Person.LAST_NAME, Person.EMAIL)
    .from(Tables.PERSON)
    .where(Person.ID.eq(id))
    .fetchSingleMapped(rec => ({
      id: rec.get(Person.ID),
      firstName: rec.get(Person.FIRST_NAME),
      lastName: rec.get(Person.LAST_NAME),
      email: rec.get(Person.EMAIL),
    }));
};
```

See the [full example application here](https://github.com/cornholio127/tsooq.example)
