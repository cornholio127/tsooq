import { FieldLike, Record } from '../model';

class RecordImpl implements Record {
  constructor(private readonly row: { [index: string]: unknown }) {}

  get<T>(field: FieldLike<T>): T {
    return this.row[
      field.alias == undefined ? field.name : field.alias.toLowerCase()
    ] as T;
  }

  print(fields: FieldLike<unknown>[]) {
    console.log('RecordImpl [');
    fields.forEach(field =>
      console.log(
        `  ${field.alias == undefined ? field.name : field.alias}: ${this.get(
          field
        )}`
      )
    );
    console.log(']');
  }
}

export default RecordImpl;
