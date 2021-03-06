import { Runnable } from './util';
import { Logger } from 'log4js';
import { QueryResult } from 'pg';

export enum Order {
  ASC,
  DESC,
}

export interface Result<T> {
  value: T;
  values: T[];
  rowCount: number;
}

export interface Renderable {
  render(): string;
}

export interface Comparable<T> extends Renderable {
  eq(value: T | FieldLike<T> | SelectFinalPart): Condition;
  ne(value: T | FieldLike<T>): Condition;
  lt(value: T | FieldLike<T>): Condition;
  lte(value: T | FieldLike<T>): Condition;
  gt(value: T | FieldLike<T>): Condition;
  gte(value: T | FieldLike<T>): Condition;
  in(values: T[] | SelectFinalPart): Condition;
  like(value: T): Condition;
  isNull(): Condition;
  isNotNull(): Condition;
}

export interface FieldLike<T> extends Comparable<T> {
  name: string;
  alias: string;
  as(alias: string): FieldLike<T>;
  plus(value: number): FieldLike<number>;
  minus(value: number): FieldLike<number>;
  asc(): SortField<T>;
  desc(): SortField<T>;
}

export interface Field<T> extends FieldLike<T> {
  ordinal: number;
  name: string;
  alias: string;
  dataType: string;
  isNullable: boolean;
  hasDefault: boolean;
  as(alias: string): Field<T>;
}

export interface SortField<T> {
  sort: Order;
  render(): string;
}

export interface Table {
  name: string;
  alias: string;
  fields: Field<unknown>[];
  as(alias: string): Table;
}

export interface QueryPart {
  render(params: unknown[]): string;
}

export interface SelectPart {
  from(table: Table): FromPart;
}

export interface UpdatePart {
  set<T>(field: Field<T>, value: T | FieldLike<T>): AssignFieldPart;
}

export interface AssignFieldPart extends UpdateFinalPart {
  set<T>(field: Field<T>, value: T | FieldLike<T>): AssignFieldPart;
  where(cond: Condition): UpdateWherePart;
}

export interface FromPart extends SelectFinalPart {
  join(table: Table): JoinPart;
  leftOuterJoin(table: Table): JoinPart;
  where(cond: Condition): SelectWherePart;
  groupBy(...fields: FieldLike<unknown>[]): GroupByPart;
  orderBy(field: SortField<unknown>): OrderPart;
}

export interface JoinPart {
  on(cond: Condition): JoinConditionPart;
}

export interface JoinConditionPart extends SelectFinalPart {
  join(table: Table): JoinPart;
  leftOuterJoin(table: Table): JoinPart;
  orderBy(field: SortField<unknown>): OrderPart;
  where(cond: Condition): SelectWherePart;
}

export interface GroupByPart extends SelectFinalPart {
  orderBy(field: SortField<unknown>): OrderPart;
  having(cond: Condition): HavingPart;
}

export interface HavingPart extends SelectFinalPart {
  orderBy(field: SortField<unknown>): OrderPart;
}

export interface SelectWherePart extends SelectFinalPart {
  groupBy(...fields: FieldLike<unknown>[]): GroupByPart;
  orderBy(field: SortField<unknown>): OrderPart;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UpdateWherePart extends UpdateFinalPart {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OrderPart extends SelectFinalPart {}

export type Mapper<T> = (record: Record) => T;

export interface SelectFinalPart {
  limit(limit: number): SelectFinalPart;
  offset(offset: number): SelectFinalPart;
  fetch(): Promise<Record[]>;
  fetchSingle(): Promise<Record>;
  fetchMapped<T>(mapper: Mapper<T>): Promise<T[]>;
  fetchSingleMapped<T>(mapper: Mapper<T>): Promise<T>;
}

export interface UpdateFinalPart {
  runnable(): Runnable;
  execute(): Promise<Result<void>>;
}

export interface InsertIntoPart1<T1> {
  values(v1: T1): InsertValuesPart;
}

export interface InsertIntoPart2<T1, T2> {
  values(v1: T1, v2: T2): InsertValuesPart;
}

export interface InsertIntoPart3<T1, T2, T3> {
  values(v1: T1, v2: T2, v3: T3): InsertValuesPart;
}

export interface InsertIntoPart4<T1, T2, T3, T4> {
  values(v1: T1, v2: T2, v3: T3, v4: T4): InsertValuesPart;
}

export interface InsertIntoPart5<T1, T2, T3, T4, T5> {
  values(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5): InsertValuesPart;
}

export interface InsertIntoPart6<T1, T2, T3, T4, T5, T6> {
  values(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6): InsertValuesPart;
}

export interface InsertIntoPart7<T1, T2, T3, T4, T5, T6, T7> {
  values(
    v1: T1,
    v2: T2,
    v3: T3,
    v4: T4,
    v5: T5,
    v6: T6,
    v7: T7
  ): InsertValuesPart;
}

export interface InsertIntoPart8<T1, T2, T3, T4, T5, T6, T7, T8> {
  values(
    v1: T1,
    v2: T2,
    v3: T3,
    v4: T4,
    v5: T5,
    v6: T6,
    v7: T7,
    v8: T8
  ): InsertValuesPart;
}

export interface InsertIntoPart9<T1, T2, T3, T4, T5, T6, T7, T8, T9> {
  values(
    v1: T1,
    v2: T2,
    v3: T3,
    v4: T4,
    v5: T5,
    v6: T6,
    v7: T7,
    v8: T8,
    v9: T9
  ): InsertValuesPart;
}

export interface InsertIntoPart10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> {
  values(
    v1: T1,
    v2?: T2,
    v3?: T3,
    v4?: T4,
    v5?: T5,
    v6?: T6,
    v7?: T7,
    v8?: T8,
    v9?: T9,
    v10?: T10
  ): InsertValuesPart;
}

export interface InsertFinalPart<T> {
  execute(): Promise<Result<T>>;
  runnable(): Runnable<T>;
}

export interface InsertValuesPart {
  execute(): Promise<Result<void>>;
  runnable(): Runnable<{}>;
  returning<T>(field: Field<T>): InsertFinalPart<T>;
}

export interface DeleteFromPart extends DeleteFinalPart {
  where(cond: Condition): DeleteWherePart;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeleteWherePart extends DeleteFinalPart {}

export interface DeleteFinalPart {
  runnable(): Runnable;
  execute(): Promise<Result<void>>;
}

export interface Condition extends QueryPart {
  and(cond: Condition): Condition;
  or(cond: Condition): Condition;
}

export interface Record {
  get<T>(field: FieldLike<T>): T;
  print(fields: FieldLike<unknown>[]): void;
}

export interface Create {
  select(...fields: FieldLike<unknown>[]): SelectPart;
  update(table: Table): UpdatePart;
  insertInto<T1>(table: Table, f1: Field<T1>): InsertIntoPart1<T1>;
  insertInto<T1, T2>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>
  ): InsertIntoPart2<T1, T2>;
  insertInto<T1, T2, T3>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>,
    f3: Field<T3>
  ): InsertIntoPart3<T1, T2, T3>;
  insertInto<T1, T2, T3, T4>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>,
    f3: Field<T3>,
    f4: Field<T4>
  ): InsertIntoPart4<T1, T2, T3, T4>;
  insertInto<T1, T2, T3, T4, T5>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>,
    f3: Field<T3>,
    f4: Field<T4>,
    f5: Field<T5>
  ): InsertIntoPart5<T1, T2, T3, T4, T5>;
  insertInto<T1, T2, T3, T4, T5, T6>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>,
    f3: Field<T3>,
    f4: Field<T4>,
    f5: Field<T5>,
    f6: Field<T6>
  ): InsertIntoPart6<T1, T2, T3, T4, T5, T6>;
  insertInto<T1, T2, T3, T4, T5, T6, T7>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>,
    f3: Field<T3>,
    f4: Field<T4>,
    f5: Field<T5>,
    f6: Field<T6>,
    f7: Field<T7>
  ): InsertIntoPart7<T1, T2, T3, T4, T5, T6, T7>;
  insertInto<T1, T2, T3, T4, T5, T6, T7, T8>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>,
    f3: Field<T3>,
    f4: Field<T4>,
    f5: Field<T5>,
    f6: Field<T6>,
    f7: Field<T7>,
    f8: Field<T8>
  ): InsertIntoPart8<T1, T2, T3, T4, T5, T6, T7, T8>;
  insertInto<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>,
    f3: Field<T3>,
    f4: Field<T4>,
    f5: Field<T5>,
    f6: Field<T6>,
    f7: Field<T7>,
    f8: Field<T8>,
    f9: Field<T9>
  ): InsertIntoPart9<T1, T2, T3, T4, T5, T6, T7, T8, T9>;
  insertInto<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    table: Table,
    f1: Field<T1>,
    f2: Field<T2>,
    f3: Field<T3>,
    f4: Field<T4>,
    f5: Field<T5>,
    f6: Field<T6>,
    f7: Field<T7>,
    f8: Field<T8>,
    f9: Field<T9>,
    f10?: Field<T10>
  ): InsertIntoPart10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>;
  deleteFrom(table: Table): DeleteFromPart;
  transaction<T>(...runnables: Runnable<unknown>[]): Promise<T>;
  setLogger(logger: Logger): void;
  // For testing
  getDb(): Database;
}

export interface Database {
  toRunnable(parts: QueryPart[]): Runnable;
  execute(parts: QueryPart[]): Promise<Result<void>>;
  fetch<T>(
    parts: QueryPart[],
    mapper?: (record: Record) => T
  ): Promise<Record[] | T[]>;
  fetchSingle<T>(
    parts: QueryPart[],
    mapper?: (record: Record) => T
  ): Promise<Record | T>;
  insert<T>(
    table: Table,
    fields: Field<unknown>[],
    values: unknown[],
    returning?: Field<T>
  ): Runnable<T>;
  executeInsert<T>(
    table: Table,
    fields: Field<unknown>[],
    values: unknown[],
    returning?: Field<T>
  ): Promise<Result<T>>;
  executeInTransaction<T = void>(
    query: string,
    params: unknown[],
    returning?: Field<T>
  ): Promise<Result<T>>;
  query(
    queryString: string,
    params: unknown[],
    callback: (err: Error, result: QueryResult<unknown>) => void
  ): void;
  transaction<T = void>(...runnables: Runnable<unknown>[]): Promise<T>;
  setLogger(logger: Logger): void;
}
