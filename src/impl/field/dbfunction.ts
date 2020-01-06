import FieldLikeImpl from './fieldlikeimpl';

class DbFunction<T> extends FieldLikeImpl<T> {
  constructor(private readonly func: string, alias?: string) {
    super(alias);
  }

  as(alias: string) {
    return new DbFunction<T>(this.func, alias);
  }

  render() {
    return this.func;
  }
}

export default DbFunction;
