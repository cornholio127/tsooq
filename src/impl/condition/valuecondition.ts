import { Condition, Renderable } from '../../model';
import CombinedCondition from './combinedcondition';

class ValueCondition<T> implements Condition {
  constructor(
    private readonly op: string,
    private readonly field: Renderable,
    private readonly value: T
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: unknown[]) {
    params.push(this.value);
    return `${this.field.render()} ${this.op} $${params.length}`;
  }
}

export default ValueCondition;
