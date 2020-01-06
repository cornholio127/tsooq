import { Condition, Renderable, FieldLike } from '../../model';
import CombinedCondition from './combinedcondition';

class FieldCondition<T> implements Condition {
  constructor(
    private readonly op: string,
    private readonly field1: Renderable,
    private readonly field2: FieldLike<T>
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    return `${this.field1.render()} ${this.op} ${this.field2.render()}`;
  }
}

export default FieldCondition;
