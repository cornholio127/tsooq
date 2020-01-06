import {
  FromPart,
  SelectPart,
  QueryPart,
  FieldLike,
  Field,
  Table,
} from '../../model';
import FromPartImpl from './frompartimpl';
import { Database } from '../database';

class SelectPartImpl implements SelectPart, QueryPart {
  private readonly db: Database;
  private readonly fields: FieldLike<unknown>[];
  private readonly parts: QueryPart[];

  constructor(db: Database, fields: Field<unknown>[]) {
    this.db = db;
    this.fields = fields;
    this.parts = [this];
  }

  from(table: Table): FromPart {
    return new FromPartImpl(this.db, this.parts, table);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    if (this.fields.length === 0) {
      return 'SELECT *';
    }
    return (
      'SELECT ' +
      this.fields
        .map(field =>
          field.alias == undefined
            ? field.render()
            : `${field.render()} AS "${field.alias}"`
        )
        .join(', ')
    );
  }
}

export default SelectPartImpl;
