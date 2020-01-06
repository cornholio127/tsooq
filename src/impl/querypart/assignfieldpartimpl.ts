import {
  Field,
  QueryPart,
  AssignFieldPart,
  FieldLike,
  Condition,
  UpdateWherePart,
  Result,
  Database,
} from '../../model';
import { Runnable } from '../../util';
import { isFieldLike } from '../util';
import WherePartImpl from './wherepartimpl';

class AssignFieldPartImpl implements AssignFieldPart, QueryPart {
  private readonly db: Database;
  private readonly fields: Field<unknown>[];
  private readonly values: unknown[];
  private readonly parts: QueryPart[];

  constructor(
    db: Database,
    parts: QueryPart[],
    field: Field<unknown>,
    value: unknown
  ) {
    this.db = db;
    this.fields = [field];
    this.values = [value];
    this.parts = parts.concat(this);
  }

  set<T>(field: Field<T>, value: T | FieldLike<T>) {
    this.fields.push(field);
    this.values.push(value);
    return this;
  }

  where(cond: Condition): UpdateWherePart {
    return new WherePartImpl(this.db, this.parts, cond);
  }

  runnable(): Runnable {
    return this.db.toRunnable(this.parts);
  }

  execute(): Promise<Result<void>> {
    return this.db.execute(this.parts);
  }

  render(params: unknown[]) {
    const assignments: string[] = [];
    for (let i = 0; i < this.fields.length; i++) {
      if (isFieldLike(this.values[i])) {
        const value: FieldLike<unknown> = this.values[i] as FieldLike<unknown>;
        assignments.push(`${this.fields[i].name}=${value.render()}`);
      } else {
        params.push(this.values[i]);
        assignments.push(`${this.fields[i].name}=$${params.length}`);
      }
    }
    return 'SET ' + assignments.join(', ');
  }
}

export default AssignFieldPartImpl;
