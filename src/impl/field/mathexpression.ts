import { FieldLike, Renderable } from '../../model';
import FieldLikeImpl from './fieldlikeimpl';

class MathExpression extends FieldLikeImpl<number> {
  constructor(
    private readonly field: Renderable,
    private readonly op: '+' | '-',
    private readonly value: number,
    alias?: string
  ) {
    super(alias);
  }
  as(alias: string): FieldLike<number> {
    return new MathExpression(this.field, this.op, this.value, alias);
  }
  render(): string {
    return `${this.field.render()} ${this.op} ${this.value}`;
  }
}

export default MathExpression;
