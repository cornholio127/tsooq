import { Condition } from '../../model';

class CombinedCondition implements Condition {
  constructor(
    private readonly op: 'AND' | 'OR',
    private readonly cond1: Condition,
    private readonly cond2: Condition
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: unknown[]): string {
    return `(${this.cond1.render(params)} ${this.op} ${this.cond2.render(
      params
    )})`;
  }
}

export default CombinedCondition;
