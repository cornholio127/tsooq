import { SelectFinalPart, Record, Mapper, QueryPart } from '../../model';
import { Database } from '../database';

abstract class SelectFinalPartImpl implements SelectFinalPart, QueryPart {
  readonly db: Database;
  readonly parts: QueryPart[];

  constructor(db: Database, parts: QueryPart[]) {
    this.db = db;
    this.parts = parts.concat(this);
  }

  limit(limit: number) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new SelectCursorPartImpl(this.db, this.parts, { limit });
  }

  offset(offset: number) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new SelectCursorPartImpl(this.db, this.parts, { offset });
  }

  fetch() {
    return this.db.fetch(this.parts) as Promise<Record[]>;
  }

  fetchSingle() {
    return this.db.fetchSingle(this.parts) as Promise<Record>;
  }

  fetchMapped<T>(mapper: Mapper<T>) {
    return this.db.fetch(this.parts, mapper) as Promise<T[]>;
  }

  fetchSingleMapped<T>(mapper: Mapper<T>) {
    return this.db.fetchSingle(this.parts, mapper) as Promise<T>;
  }

  abstract render(params: unknown[]): string;
}

interface Cursor {
  limit?: number;
  offset?: number;
}

class SelectCursorPartImpl extends SelectFinalPartImpl
  implements SelectFinalPart, QueryPart {
  private readonly cursor: Cursor = {};

  constructor(db: Database, parts: QueryPart[], cursor: Cursor) {
    super(db, parts);
    this.cursor = cursor;
  }

  limit(limit: number) {
    this.cursor.limit = limit;
    return this;
  }

  offset(offset: number) {
    this.cursor.offset = offset;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(params: unknown[]): string {
    const parts: string[] = [];
    if (this.cursor.limit) {
      parts.push(`LIMIT ${this.cursor.limit}`);
    }
    if (this.cursor.offset) {
      parts.push(`OFFSET ${this.cursor.offset}`);
    }
    return parts.join(' ');
  }
}

export default SelectFinalPartImpl;
