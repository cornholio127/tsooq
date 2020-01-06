import { Condition, Renderable } from '../../model';
import CombinedCondition from './combinedcondition';

class NullCondition implements Condition {
  constructor(
    private readonly field: Renderable,
    private readonly isNull: boolean
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]) {
    return `${this.field.render()} IS ${this.isNull ? '' : 'NOT '}NULL`;
  }
}

export default NullCondition;
