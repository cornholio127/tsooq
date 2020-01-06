import { Comparable, Condition, FieldLike, SelectFinalPart } from '../../model';
import InCondition from '../condition/incondition';
import NullCondition from '../condition/nullcondition';
import { isFieldLike, isSubquery } from '../util';
import SubqueryCondition from '../condition/subquerycondition';
import ValueCondition from '../condition/valuecondition';
import FieldCondition from '../condition/fieldcondition';

abstract class ComparableImpl<T> implements Comparable<T> {
  eq(value: T | FieldLike<T> | SelectFinalPart): Condition {
    return this.condition('=', value);
  }

  ne(value: T | FieldLike<T>): Condition {
    return this.condition('!=', value);
  }

  lt(value: T | FieldLike<T>): Condition {
    return this.condition('<', value);
  }

  lte(value: T | FieldLike<T>): Condition {
    return this.condition('<=', value);
  }

  gt(value: T | FieldLike<T>): Condition {
    return this.condition('>', value);
  }

  gte(value: T | FieldLike<T>): Condition {
    return this.condition('>=', value);
  }

  in(value: T[] | SelectFinalPart): Condition {
    return new InCondition(this, value);
  }

  like(value: T): Condition {
    return this.condition('LIKE', value);
  }

  isNull(): Condition {
    return new NullCondition(this, true);
  }

  isNotNull(): Condition {
    return new NullCondition(this, false);
  }

  private condition(
    op: string,
    value: T | FieldLike<T> | SelectFinalPart
  ): Condition {
    if (isFieldLike(value)) {
      return new FieldCondition(op, this, value as FieldLike<unknown>);
    } else if (isSubquery(value)) {
      return new SubqueryCondition(op, this, value as SelectFinalPart);
    } else {
      return new ValueCondition(op, this, value);
    }
  }

  abstract render(): string;
}

export default ComparableImpl;
