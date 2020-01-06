import { Condition, Renderable, SelectFinalPart } from '../../model';
import CombinedCondition from './combinedcondition';
import { renderSubquery } from '../util';

class InCondition<T> implements Condition {
  constructor(
    private readonly field: Renderable,
    private readonly value: T[] | SelectFinalPart
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: unknown[]) {
    if (Array.isArray(this.value)) {
      const placeholders: string[] = [];
      this.value.forEach(value => {
        params.push(value);
        placeholders.push('$' + params.length);
      });
      return `${this.field.render()} IN (${placeholders.join(', ')})`;
    } else {
      return `${this.field.render()} IN (${renderSubquery(
        this.value,
        params
      )})`;
    }
  }
}

export default InCondition;
