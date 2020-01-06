import { Condition, Renderable, SelectFinalPart } from '../../model';
import CombinedCondition from './combinedcondition';
import { renderSubquery } from '../util';

class SubqueryCondition implements Condition {
  constructor(
    private readonly op: string,
    private readonly field: Renderable,
    private readonly subQuery: SelectFinalPart
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: unknown[]) {
    return `${this.field.render()} ${this.op} (${renderSubquery(
      this.subQuery,
      params
    )})`;
  }
}

export default SubqueryCondition;
