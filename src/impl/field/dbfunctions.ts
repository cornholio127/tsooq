import { FieldLike } from '../../model';
import DbFunction from './dbfunction';
import DbFieldFunction from './dbfieldfunction';
import DistinctOnImpl from './distinctonimpl';

export class DbFunctions {
  static null() {
    return new DbFunction<unknown>('NULL');
  }

  static now() {
    return new DbFunction<Date>('NOW()');
  }

  static currentDate() {
    return new DbFunction<Date>('CURRENT_DATE');
  }

  static count(field?: FieldLike<unknown>): FieldLike<number> {
    return field == undefined
      ? new DbFunction<number>('COUNT(*)')
      : new DbFieldFunction<number>('COUNT', field);
  }

  static distinct<T>(field: FieldLike<T>): FieldLike<T> {
    return new DbFieldFunction<T>('DISTINCT', field);
  }

  static distinctOn<T>(
    groupField: FieldLike<unknown>,
    field: FieldLike<T>
  ): FieldLike<T> {
    return new DistinctOnImpl<T>(groupField, field);
  }

  static min<T>(field: FieldLike<T>): FieldLike<T> {
    return new DbFieldFunction<T>('MIN', field);
  }

  static max<T>(field: FieldLike<T>): FieldLike<T> {
    return new DbFieldFunction<T>('MAX', field);
  }
}

export default DbFunctions;
