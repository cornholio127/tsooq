import { Pool, QueryResult, PoolClient } from 'pg';
import { Runnable, runnable, transaction2, Result, Runnable2 } from './util';
import { Logger } from 'log4js';

enum Order {
  ASC,
  DESC,
}

const isSubquery = (x: any) => (typeof x) === 'object' && 'render' in x;

const isFieldLike = (x: any) => (typeof x) === 'object' && 'name' in x && 'alias' in x;

const renderSubquery: (subQuery: any, params: any[]) => string = (subQuery, params) => {
  const parts: QueryPart[] = subQuery.parts;
  return parts.map(p => p.render(params)).join(' ');
};

abstract class FieldLikeImpl<T> implements FieldLike<T> {
  constructor(
    readonly alias: string,
  ) {}
  get name() {
    return this.render();
  }
  abstract as(alias: string): FieldLike<T>;
  asc() {
    return new SortFieldImpl<T>(this.alias == undefined ? this.render() : this.alias, Order.ASC);
  }
  desc() {
    return new SortFieldImpl<T>(this.alias == undefined ? this.render() : this.alias, Order.DESC);
  }
  plus(value: number): FieldLike<number> {
    throw new Error('not implemented');
  }
  minus(value: number): FieldLike<number> {
    throw new Error('not implemented');
  }
  abstract render(): string;
}

class DbFunction<T> extends FieldLikeImpl<T> {
  constructor(
    private readonly func: string,
    alias?: string,
  ) {
    super(alias);
  }

  as(alias: string) {
    return new DbFunction<T>(this.func, alias);
  }

  render() {
    return this.func;
  }
}

class MathExpression extends FieldLikeImpl<number> {
  constructor(
    private readonly field: Field<any>,
    private readonly op: '+' | '-',
    private readonly value: number,
    alias?: string,
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

class DbFieldFunction<T> extends FieldLikeImpl<T> {
  constructor(
    private readonly func: string,
    private field: FieldLike<any>,
    alias?: string,
  ) {
    super(alias);
  }
  as(alias: string) {
    return new DbFieldFunction<T>(this.func, this.field, alias);
  }
  render() {
    return `${this.func}(${this.field.render()})`;
  }
}

class DistinctOnImpl<T> extends FieldLikeImpl<T> {
  constructor(
    private readonly groupField: FieldLike<any>,
    private field: FieldLike<any>,
    alias?: string,
  ) {
    super(alias);
  }
  as(alias: string) {
    return new DistinctOnImpl<T>(this.groupField, this.field, alias);
  }
  render() {
    return `DISTINCT ON (${this.groupField.render()}) ${this.field.render()}`;
  }
}

export class DbFunctions {
  private constructor() {}

  static null() {
    return new DbFunction<any>('NULL');
  }

  static now() {
    return new DbFunction<Date>('NOW()');
  }

  static currentDate() {
    return new DbFunction<Date>('CURRENT_DATE');
  }

  static count(field?: FieldLike<any>): FieldLike<number> {
    return field == undefined ? new DbFunction<number>('COUNT(*)') : new DbFieldFunction<number>('COUNT', field);
  }

  static distinct<T>(field: FieldLike<T>): FieldLike<T> {
    return new DbFieldFunction<T>('DISTINCT', field);
  }

  static distinctOn<T>(groupField: FieldLike<any>, field: FieldLike<T>): FieldLike<T> {
    return new DistinctOnImpl<T>(groupField, field);
  }

  static min<T>(field: FieldLike<T>): FieldLike<T> {
    return new DbFieldFunction<T>('MIN', field);
  }

  static max<T>(field: FieldLike<T>): FieldLike<T> {
    return new DbFieldFunction<T>('MAX', field);
  }
}

export interface FieldLike<T> {
  name: string;
  alias: string;
  as(alias: string): FieldLike<T>;
  plus(value: number): FieldLike<number>;
  minus(value: number): FieldLike<number>;
  asc(): SortField<T>;
  desc(): SortField<T>;
  render(): string;
}

export interface Field<T> extends FieldLike<T> {
  ordinal: number;
  name: string;
  alias: string;
  dataType: string;
  isNullable: boolean;
  hasDefault: boolean;
  eq(value: T | FieldLike<T> | SelectFinalPart): Condition;
  ne(value: T | FieldLike<T>): Condition;
  lt(value: T | FieldLike<T>): Condition;
  lte(value: T | FieldLike<T>): Condition;
  gt(value: T | FieldLike<T>): Condition;
  gte(value: T | FieldLike<T>): Condition;
  in(values: T[] | SelectFinalPart): Condition;
  isNull(): Condition;
  isNotNull(): Condition;
  as(alias: string): Field<T>;
}

export interface SortField<T> {
  sort: Order;
  render(): string;
}

class SortFieldImpl<T> implements SortField<T> {
  constructor(
    private readonly name: string,
    readonly sort: Order,
  ) {}

  render() {
    return this.name;
  }
}

export class FieldImpl<T> implements Field<T>, SortField<T> {
  constructor(
    private readonly tableName: string,
    readonly ordinal: number,
    readonly name: string,
    readonly alias: string,
    readonly dataType: string,
    readonly isNullable: boolean,
    readonly hasDefault: boolean,
    readonly sort: Order = undefined,
  ) {}

  render() {
    return `${this.tableName}.${this.name}`;
  }

  eq(value: T | FieldLike<T> | SelectFinalPart): Condition {
    return this.condition('=', value);
  }

  ne(value: T | FieldLike<T>): Condition {
    return this.condition('!=', value);
  }

  lt(value: T | FieldLike<T>): Condition {
    return this.condition('<', value);
  }

  lte(value: T | FieldLike<T>): Condition {
    return this.condition('<=', value);
  }

  gt(value: T | FieldLike<T>): Condition {
    return this.condition('>', value);
  }

  gte(value: T | FieldLike<T>): Condition {
    return this.condition('>=', value);
  }

  in(value: T[] | SelectFinalPart): Condition {
    return new InCondition(this, value);
  }

  isNull(): Condition {
    return new NullCondition(this, true);
  }

  isNotNull(): Condition {
    return new NullCondition(this, false);
  }

  asc(): SortField<T> {
    return new FieldImpl<T>(this.tableName, this.ordinal, this.name, this.alias, this.dataType, this.isNullable, this.hasDefault, Order.ASC);
  }

  desc(): SortField<T> {
    return new FieldImpl<T>(this.tableName, this.ordinal, this.name, this.alias, this.dataType, this.isNullable, this.hasDefault, Order.DESC);
  }

  plus(value: number): FieldLike<number> {
    return new MathExpression(this, '+', value);
  }

  minus(value: number): FieldLike<number> {
    return new MathExpression(this, '-', value);
  }

  as(alias: string) {
    return new FieldImpl<T>(this.tableName, this.ordinal, this.name, alias, this.dataType, this.isNullable, this.hasDefault);
  }

  private condition(op: string, value: T | FieldLike<T> | SelectFinalPart): Condition {
    if (isFieldLike(value)) {
      return new FieldCondition(op, this, value as FieldLike<any>);
    } else if (isSubquery(value)) {
      return new SubqueryCondition(op, this, value as SelectFinalPart);
    } else {
      return new ValueCondition(op, this, value);
    }
  }
}

export interface Table {
  name: string;
  alias: string;
  fields: Field<any>[];
  as(alias: string): Table;
}

export class TableImpl implements Table {
  constructor(
    readonly name: string,
    readonly alias: string,
    readonly fields: Field<any>[],
  ) {}

  as(alias: string) {
    return new TableImpl(this.name, alias, this.fields);
  }
}

export interface QueryPart {
  render(params: any[]): string;
}

export interface SelectPart {
  from(table: Table): FromPart;
}

class SelectPartImpl implements SelectPart, QueryPart {

  private readonly create: CreateImpl;
  private readonly fields: FieldLike<any>[];
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, fields: Field<any>[]) {
    this.create = create;
    this.fields = fields;
    this.parts = [this];
  }

  from(table: Table): FromPart {
    return new FromPartImpl(this.create, this.parts, table);
  }

  render(params: any[]) {
    if (this.fields.length === 0) {
      return 'SELECT *';
    }
    return 'SELECT ' + this.fields.map(field => field.alias == undefined ? field.render() : `${field.render()} AS ${field.alias}`).join(', ');
  }
}

export interface UpdatePart {
  set<T>(field: Field<T>, value: T | FieldLike<T>): AssignFieldPart;
}

class UpdatePartImpl implements UpdatePart, QueryPart {

  private readonly create: CreateImpl;
  private readonly table: Table;
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, table: Table) {
    this.create = create;
    this.table = table;
    this.parts = [this];
  }

  set<T>(field: Field<T>, value: T) {
    return new AssignFieldPartImpl(this.create, this.parts, field, value);
  }

  render(params: any[]) {
    return 'UPDATE ' + this.table.name;
  }

}

export interface AssignFieldPart extends UpdateFinalPart {
  set<T>(field: Field<T>, value: T | FieldLike<T>): AssignFieldPart;
  where(cond: Condition): UpdateWherePart;
}

class AssignFieldPartImpl implements AssignFieldPart, QueryPart {

  private readonly create: CreateImpl;
  private readonly fields: Field<any>[];
  private readonly values: any[];
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, parts: QueryPart[], field: Field<any>, value: any) {
    this.create = create;
    this.fields = [field];
    this.values = [value];
    this.parts = parts.concat(this);
  }

  set<T>(field: Field<T>, value: T | FieldLike<T>) {
    this.fields.push(field);
    this.values.push(value);
    return this;
  }

  where(cond: Condition): UpdateWherePart {
    return new WherePartImpl(this.create, this.parts, cond);
  }

  toRunnable(): Runnable {
    return this.create.toRunnable(this.parts);
  }

  execute(): Promise<void> {
    return this.create.execute(this.parts);
  }

  render(params: any[]) {
    const assignments: string[] = [];
    for (let i = 0; i < this.fields.length; i++) {
      if (isFieldLike(this.values[i])) {
        const value: FieldLike<any> = this.values[i];
        assignments.push(`${this.fields[i].name}=${value.render()}`);
      } else {
        params.push(this.values[i]);
        assignments.push(`${this.fields[i].name}=$${params.length}`);
      }
    }
    return 'SET ' + assignments.join(', ');
  }
}

export interface FromPart extends SelectFinalPart {
  join(table: Table): JoinPart;
  leftOuterJoin(table: Table): JoinPart;
  where(cond: Condition): SelectWherePart;
  groupBy(...fields: FieldLike<any>[]): GroupByPart;
  orderBy(field: SortField<any>): OrderPart;
}

class FromPartImpl implements FromPart, QueryPart {

  private readonly create: CreateImpl;
  private readonly table: Table;
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, parts: QueryPart[], table: Table) {
    this.create = create;
    this.table = table;
    this.parts = parts.concat(this);
  }

  join(table: Table) {
    return new JoinPartImpl(this.create, this.parts, table);
  }

  leftOuterJoin(table: Table) {
    return new LeftOuterJoinPartImpl(this.create, this.parts, table);
  }

  where(cond: Condition): SelectWherePart {
    return new WherePartImpl(this.create, this.parts, cond);
  }

  groupBy(...fields: FieldLike<any>[]) {
    return new GroupByPartImpl(this.create, this.parts, fields);
  }

  orderBy(field: SortField<any>) {
    return new OrderPartImpl(this.create, this.parts, field);
  }

  fetch() {
    return this.create.fetch(this.parts);
  }

  fetchSingle() {
    return this.create.fetchSingle(this.parts);
  }

  fetchMapped<T>(mapper: Mapper<T>) {
    return this.create.fetch(this.parts, mapper);
  }

  fetchSingleMapped<T>(mapper: Mapper<T>) {
    return this.create.fetchSingle(this.parts, mapper);
  }

  render(params: any[]) {
    return 'FROM ' + this.table.name;
  }
}

export interface JoinPart {
  on(cond: Condition): JoinConditionPart;
}

class JoinPartImpl implements JoinPart, QueryPart {
  private readonly create: CreateImpl;
  private readonly table: Table;
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, parts: QueryPart[], table: Table) {
    this.create = create;
    this.table = table;
    this.parts = parts.concat(this);
  }

  on(cond: Condition) {
    return new JoinConditionPartImpl(this.create, this.parts, cond);
  }

  render(params: any[]) {
    return 'JOIN ' + this.table.name;
  }
}

class LeftOuterJoinPartImpl extends JoinPartImpl {
  render(params: any[]) {
    return 'LEFT OUTER ' + super.render(params);
  }
}

export interface JoinConditionPart extends SelectFinalPart {
  join(table: Table): JoinPart;
  leftOuterJoin(table: Table): JoinPart;
  orderBy(field: SortField<any>): OrderPart;
  where(cond: Condition): SelectWherePart;
}

class JoinConditionPartImpl implements JoinConditionPart, QueryPart {
  private readonly create: CreateImpl;
  private readonly cond: Condition;
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, parts: QueryPart[], cond: Condition) {
    this.create = create;
    this.cond = cond;
    this.parts = parts.concat(this);
  }

  join(table: Table) {
    return new JoinPartImpl(this.create, this.parts, table);
  }

  leftOuterJoin(table: Table) {
    return new LeftOuterJoinPartImpl(this.create, this.parts, table);
  }

  where(cond: Condition): SelectWherePart {
    return new WherePartImpl(this.create, this.parts, cond);
  }

  orderBy(field: SortField<any>): OrderPart {
    return new OrderPartImpl(this.create, this.parts, field);
  }

  fetch() {
    return this.create.fetch(this.parts);
  }

  fetchSingle() {
    return this.create.fetchSingle(this.parts);
  }

  fetchMapped<T>(mapper: Mapper<T>) {
    return this.create.fetch(this.parts, mapper);
  }

  fetchSingleMapped<T>(mapper: Mapper<T>) {
    return this.create.fetchSingle(this.parts, mapper);
  }

  toRunnable(): Runnable {
    return this.create.toRunnable(this.parts);
  }

  execute(): Promise<void> {
    return this.create.execute(this.parts);
  }

  render(params: any[]) {
    return 'ON ' + this.cond.render(params);
  }
}

export interface GroupByPart extends SelectFinalPart {
  orderBy(field: SortField<any>): OrderPart;
}

class GroupByPartImpl implements GroupByPart, QueryPart {
  private readonly create: CreateImpl;
  private readonly fields: FieldLike<any>[];
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, parts: QueryPart[], fields: FieldLike<any>[]) {
    this.create = create;
    this.fields = fields;
    this.parts = parts.concat(this);
  }

  orderBy(field: SortField<any>): OrderPart {
    return new OrderPartImpl(this.create, this.parts, field);
  }

  fetch() {
    return this.create.fetch(this.parts);
  }

  fetchSingle() {
    return this.create.fetchSingle(this.parts);
  }

  fetchMapped<T>(mapper: Mapper<T>) {
    return this.create.fetch(this.parts, mapper);
  }

  fetchSingleMapped<T>(mapper: Mapper<T>) {
    return this.create.fetchSingle(this.parts, mapper);
  }

  render(params: any[]) {
    return `GROUP BY ${this.fields.map(field => field.render()).join(', ')}`;
  }
}

export interface SelectWherePart extends SelectFinalPart {
  groupBy(...fields: FieldLike<any>[]): GroupByPart;
  orderBy(field: SortField<any>): OrderPart;
}

export interface UpdateWherePart extends UpdateFinalPart {
}

class WherePartImpl implements SelectWherePart, UpdateWherePart, DeleteWherePart, QueryPart {

  private readonly create: CreateImpl;
  private readonly cond: Condition;
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, parts: QueryPart[], cond: Condition) {
    this.create = create;
    this.cond = cond;
    this.parts = parts.concat(this);
  }

  groupBy(...fields: FieldLike<any>[]) {
    return new GroupByPartImpl(this.create, this.parts, fields);
  }

  orderBy(field: SortField<any>): OrderPart {
    return new OrderPartImpl(this.create, this.parts, field);
  }

  fetch() {
    return this.create.fetch(this.parts);
  }

  fetchSingle() {
    return this.create.fetchSingle(this.parts);
  }

  fetchMapped<T>(mapper: Mapper<T>) {
    return this.create.fetch(this.parts, mapper);
  }

  fetchSingleMapped<T>(mapper: Mapper<T>) {
    return this.create.fetchSingle(this.parts, mapper);
  }

  toRunnable(): Runnable {
    return this.create.toRunnable(this.parts);
  }

  execute(): Promise<void> {
    return this.create.execute(this.parts);
  }

  render(params: any[]) {
    return 'WHERE ' + this.cond.render(params);
  }
}

export interface OrderPart extends SelectFinalPart {
}

export type Mapper<T> = (record: Record) => T;

export interface SelectFinalPart {
  fetch(): Promise<Record[]>;
  fetchSingle(): Promise<Record>;
  fetchMapped<T>(mapper: Mapper<T>): Promise<T[]>;
  fetchSingleMapped<T>(mapper: Mapper<T>): Promise<T>;
}

export interface UpdateFinalPart {
  toRunnable(): Runnable;
  execute(): Promise<void>;
}

class OrderPartImpl implements OrderPart, QueryPart {

  private readonly create: CreateImpl;
  private readonly orderBy: SortField<any>;
  private readonly parts: QueryPart[];

  constructor(create: CreateImpl, parts: QueryPart[], orderBy: SortField<any>) {
    this.create = create;
    this.orderBy = orderBy;
    this.parts = parts.concat(this);
  }

  fetch() {
    return this.create.fetch(this.parts);
  }

  fetchSingle() {
    return this.create.fetchSingle(this.parts);
  }

  fetchMapped<T>(mapper: Mapper<T>) {
    return this.create.fetch(this.parts, mapper);
  }

  fetchSingleMapped<T>(mapper: Mapper<T>) {
    return this.create.fetchSingle(this.parts, mapper);
  }

  render(params: any[]) {
    const dir = this.orderBy.sort === Order.ASC ? ' ASC' : this.orderBy.sort === Order.DESC ? ' DESC' : '';
    return 'ORDER BY ' + this.orderBy.render() + dir;
  }
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
  values(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6, v7: T7): InsertValuesPart;
}

export interface InsertIntoPart8<T1, T2, T3, T4, T5, T6, T7, T8> {
  values(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6, v7: T7, v8: T8): InsertValuesPart;
}

export interface InsertIntoPart9<T1, T2, T3, T4, T5, T6, T7, T8, T9> {
  values(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6, v7: T7, v8: T8, v9: T9): InsertValuesPart;
}

export interface InsertIntoPart10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> {
  values(v1: T1, v2?: T2, v3?: T3, v4?: T4, v5?: T5, v6?: T6, v7?: T7, v8?: T8, v9?: T9, v10?: T10): InsertValuesPart;
}

class InsertIntoPartImpl implements
  InsertIntoPart1<any>,
  InsertIntoPart2<any, any>,
  InsertIntoPart3<any, any, any>,
  InsertIntoPart4<any, any, any, any>,
  InsertIntoPart5<any, any, any, any, any>,
  InsertIntoPart6<any, any, any, any, any, any>,
  InsertIntoPart7<any, any, any, any, any, any, any>,
  InsertIntoPart8<any, any, any, any, any, any, any, any>,
  InsertIntoPart9<any, any, any, any, any, any, any, any, any>,
  InsertIntoPart10<any, any, any, any, any, any, any, any, any, any> {

  constructor(
    private readonly create: CreateImpl,
    private readonly table: Table,
    private readonly fields: Field<any>[],
  ) {}

  values(v1: any, v2?: any, v3?: any, v4?: any, v5?: any, v6?: any, v7?: any, v8?: any, v9?: any, v10?: any): InsertValuesPart {
    return new InsertValuesPartImpl(this.create, this.table, this.fields, [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10]);
  }
}

export interface InsertFinalPart<T> {
  runnable(): Runnable2<T>;
}

export interface InsertValuesPart {
  execute(): Promise<void>;
  runnable(): Runnable2<{}>;
  returning<T>(field: Field<T>): InsertFinalPart<T>;
}

class InsertValuesPartImpl implements InsertValuesPart {
  constructor(
    private readonly create: CreateImpl,
    private readonly table: Table,
    private readonly fields: Field<any>[],
    private readonly values: any[],
  ) {}

  execute() {
    return this.create.executeInsert(this.table, this.fields, this.values);
  }

  runnable() {
    return this.create.insert(this.table, this.fields, this.values);
  }

  returning<T>(field: Field<T>) {
    return new InsertFinalPartImpl<T>(this.create, this.table, this.fields, this.values, field);
  }
}

interface DeleteFromPart {
  where(cond: Condition): DeleteWherePart;
}

class DeleteFromPartImpl implements DeleteFromPart, QueryPart {

  private readonly create: CreateImpl;
  private readonly table: Table;
  private readonly parts: QueryPart[];

  constructor(
    create: CreateImpl,
    table: Table,
  ) {
    this.create = create;
    this.table = table;
    this.parts = [this];
  }

  where(cond: Condition): DeleteWherePart {
    return new WherePartImpl(this.create, this.parts, cond);
  }

  render(params: any[]): string {
    return `DELETE FROM ${this.table.name}`;
  }
}

interface DeleteWherePart extends DeleteFinalPart {}

interface DeleteFinalPart {
  toRunnable(): Runnable;
  execute(): Promise<void>;
}

class InsertFinalPartImpl<T> implements InsertFinalPart<T> {
  constructor(
    private readonly create: CreateImpl,
    private readonly table: Table,
    private readonly fields: Field<any>[],
    private readonly values: any[],
    private readonly returning: Field<T>,
  ) {}

  runnable() {
    return this.create.insert(this.table, this.fields, this.values, this.returning);
  }
}

export interface Condition extends QueryPart {
  and(cond: Condition): Condition;
  or(cond: Condition): Condition;
}

class CombinedCondition implements Condition {
  constructor(
    private readonly op: 'AND' | 'OR',
    private readonly cond1: Condition,
    private readonly cond2: Condition,
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: any[]): string {
    return `(${this.cond1.render(params)} ${this.op} ${this.cond2.render(params)})`;
  }
}

class FieldCondition<T> implements Condition {
  constructor(
    private readonly op: string,
    private readonly field1: Field<T>,
    private readonly field2: FieldLike<T>,
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: any[]) {
    return `${this.field1.render()} ${this.op} ${this.field2.render()}`;
  }
}

class ValueCondition<T> implements Condition {
  constructor(
    private readonly op: string,
    private readonly field: Field<T>,
    private readonly value: T,
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: any[]) {
    params.push(this.value);
    return `${this.field.render()} ${this.op} $${params.length}`;
  }
}

class SubqueryCondition implements Condition {
  constructor(
    private readonly op: string,
    private readonly field: Field<any>,
    private readonly subQuery: SelectFinalPart,
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: any[]) {
    return `${this.field.render()} ${this.op} (${renderSubquery(this.subQuery, params)})`;
  }
}

class InCondition<T> implements Condition {
  constructor(
    private readonly field: Field<T>,
    private readonly value: T[] | SelectFinalPart,
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: any[]) {
    if (Array.isArray(this.value)) {
      const placeholders: string[] = [];
      this.value.forEach(value => {
        params.push(value);
        placeholders.push('$' + params.length);
      });
      return `${this.field.render()} IN (${placeholders.join(', ')})`;
    } else {
      return `${this.field.render()} IN (${renderSubquery(this.value, params)})`;
    }
  }
}

class NullCondition implements Condition {
  constructor(
    private readonly field: Field<any>,
    private readonly isNull: boolean,
  ) {}
  and(cond: Condition): Condition {
    return new CombinedCondition('AND', this, cond);
  }
  or(cond: Condition): Condition {
    return new CombinedCondition('OR', this, cond);
  }
  render(params: any[]) {
    return `${this.field.render()} IS ${this.isNull ? '' : 'NOT '}NULL`;
  }
}

export interface Record {
  get<T>(field: FieldLike<T>): T;
  print(fields: FieldLike<any>[]): void;
}

class RecordImpl implements Record {

  constructor(private readonly row: any) {}

  get<T>(field: FieldLike<T>): T {
    return this.row[field.alias == undefined ? field.name : field.alias.toLowerCase()];
  }

  print(fields: FieldLike<any>[]) {
    console.log('RecordImpl [');
    fields.forEach(field => console.log(`  ${field.alias == undefined ? field.name : field.alias}: ${this.get(field)}`));
    console.log(']');
  }

}

export class QueryFactory {
  static create(pool: Pool): Create {
    return new CreateImpl(pool);
  }
}

export const select: (...fields: FieldLike<any>[]) => SelectPart = (...fields: Field<any>[]) => new SelectPartImpl(undefined, fields);

export interface Create {
  select(...fields: FieldLike<any>[]): SelectPart;
  update(table: Table): UpdatePart;
  insertInto<T1>(table: Table, f1: Field<T1>): InsertIntoPart1<T1>;
  insertInto<T1, T2>(table: Table, f1: Field<T1>, f2: Field<T2>): InsertIntoPart2<T1, T2>;
  insertInto<T1, T2, T3>(table: Table, f1: Field<T1>, f2: Field<T2>, f3: Field<T3>): InsertIntoPart3<T1, T2, T3>;
  insertInto<T1, T2, T3, T4>(table: Table, f1: Field<T1>, f2: Field<T2>, f3: Field<T3>, f4: Field<T4>): InsertIntoPart4<T1, T2, T3, T4>;
  insertInto<T1, T2, T3, T4, T5>(table: Table, f1: Field<T1>, f2: Field<T2>, f3: Field<T3>, f4: Field<T4>, f5: Field<T5>): InsertIntoPart5<T1, T2, T3, T4, T5>;
  insertInto<T1, T2, T3, T4, T5, T6>(table: Table, f1: Field<T1>, f2: Field<T2>, f3: Field<T3>, f4: Field<T4>, f5: Field<T5>, f6: Field<T6>): InsertIntoPart6<T1, T2, T3, T4, T5, T6>;
  insertInto<T1, T2, T3, T4, T5, T6, T7>(table: Table, f1: Field<T1>, f2: Field<T2>, f3: Field<T3>, f4: Field<T4>, f5: Field<T5>, f6: Field<T6>, f7: Field<T7>): InsertIntoPart7<T1, T2, T3, T4, T5, T6, T7>;
  insertInto<T1, T2, T3, T4, T5, T6, T7, T8>(table: Table, f1: Field<T1>, f2: Field<T2>, f3: Field<T3>, f4: Field<T4>, f5: Field<T5>, f6: Field<T6>, f7: Field<T7>, f8: Field<T8>): InsertIntoPart8<T1, T2, T3, T4, T5, T6, T7, T8>;
  insertInto<T1, T2, T3, T4, T5, T6, T7, T8, T9>(table: Table, f1: Field<T1>, f2: Field<T2>, f3: Field<T3>, f4: Field<T4>, f5: Field<T5>, f6: Field<T6>, f7: Field<T7>, f8: Field<T8>, f9: Field<T9>): InsertIntoPart9<T1, T2, T3, T4, T5, T6, T7, T8, T9>;
  insertInto<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(table: Table, f1: Field<T1>, f2: Field<T2>, f3: Field<T3>, f4: Field<T4>, f5: Field<T5>, f6: Field<T6>, f7: Field<T7>, f8: Field<T8>, f9: Field<T9>, f10?: Field<T10>): InsertIntoPart10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>;
  deleteFrom(table: Table): DeleteFromPart;
  transaction(...runnables: Runnable[]): Promise<void>;
  // For testing
  query(queryString: string, params: any[], callback: (err: Error, result: QueryResult<any>) => void): void;
  setLogger(logger: Logger): void;
}

class ResultImpl<T> implements Result<T> {
  constructor(
    private readonly queryResult: QueryResult,
    private field: Field<T>,
  ) {}

  get value() {
    return this.queryResult.rows[0][this.field.name];
  }

  get values() {
    return this.queryResult.rows.map(row => row[this.field.name]);
  }

  get rowCount() {
    return this.queryResult.rowCount;
  }
}

const formatParamsForLog = (params: string[]) => params.map(p => p != undefined && p.length > 15 ? p.substring(0, 12) + '...' : p).join();

class CreateImpl implements Create {

  private logger: Logger;

  constructor(
    private readonly pool: Pool,
  ) {}

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  private log(msg: string): void {
    if (this.logger != undefined) {
      this.logger.trace(msg);
    }
  }

  private get canLog(): boolean {
    if (this.logger == undefined) {
      return false;
    }
    return this.logger.isTraceEnabled();
  }

  select(...fields: Field<any>[]): SelectPart {
    return new SelectPartImpl(this, fields);
  }

  update(table: Table): UpdatePart {
    return new UpdatePartImpl(this, table);
  }

  insertInto(table: Table, ...fields: any[]): any {
    return new InsertIntoPartImpl(this, table, fields);
  }

  deleteFrom(table: Table): DeleteFromPart {
    return new DeleteFromPartImpl(this, table);
  }

  insert<T>(table: Table, fields: Field<any>[], values: any[], returning?: Field<T>): Runnable2<T> {
    const params: any[] = [];
    const fieldNames = fields.filter(field => field != undefined).map(field => field.name);
    const renderedValues: string[] = [];
    for (let i = 0; i < fieldNames.length; i++) {
      params.push(values[i]);
      renderedValues.push('$' + params.length);
    }
    let query = `INSERT INTO ${table.name} (${fieldNames.join(', ')}) VALUES (${renderedValues.join(', ')})`;
    if (returning != undefined) {
      query += ` RETURNING ${returning.name}`;
    }
    if (this.canLog) {
      this.log(query);
      this.log(formatParamsForLog(params));
    }
    return (client: PoolClient) => new Promise<Result<T>>((resolve, reject) => {
      client
        .query(query, params)
        .then(r => resolve(new ResultImpl<T>(r, returning)))
        .catch(reject);
    });
  }

  executeInsert(table: Table, fields: Field<any>[], values: any[]): Promise<void> {
    const params: any[] = [];
    const fieldNames = fields.filter(field => field != undefined).map(field => field.name);
    const renderedValues: string[] = [];
    for (let i = 0; i < fieldNames.length; i++) {
      params.push(values[i]);
      renderedValues.push('$' + params.length);
    }
    const query = `INSERT INTO ${table.name} (${fieldNames.join(', ')}) VALUES (${renderedValues.join(', ')})`;
    if (this.canLog) {
      this.log(query);
      this.log(formatParamsForLog(params));
    }
    return transaction2(this.pool, runnable(query, params));
  }

  query(queryString: string, params: any[], callback: (err: Error, result: QueryResult<any>) => void) {
    this.pool.query(queryString, params, callback);
  }

  fetch(parts: QueryPart[], mapper?: (record: Record) => any): Promise<any> {
    const params: any[] = [];
    const query = parts.map(part => part.render(params)).join(' ');
    if (this.canLog) {
      this.log(query);
      if (params.length > 0) {
        this.log(formatParamsForLog(params));
      }
    }
    return new Promise<Record[]>((resolve, reject) => {
      this.query(query, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const records = result.rows.map(row => new RecordImpl(row));
          if (mapper == undefined) {
            resolve(records);
          } else {
            resolve(records.map(mapper));
          }
        }
      });
    });
  }

  fetchSingle(parts: QueryPart[], mapper?: (record: Record) => any): Promise<any> {
    const params: any[] = [];
    const query = parts.map(part => part.render(params)).join(' ');
    if (this.canLog) {
      this.log(query);
      if (params.length > 0) {
        this.log(formatParamsForLog(params));
      }
    }
    return new Promise<any>((resolve, reject) => {
      this.query(query, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const records = result.rows.map(row => new RecordImpl(row));
          const single: Record = records.length === 1 ? records[0] : undefined;
          if (mapper == undefined || single == undefined) {
            resolve(single);
          } else {
            resolve(mapper(single));
          }
        }
      });
    });
  }

  toRunnable(parts: QueryPart[]): Runnable {
    const params: any[] = [];
    const query = parts.map(part => part.render(params)).join(' ');
    if (this.canLog) {
      this.log(query);
      this.log(formatParamsForLog(params));
    }
    return runnable(query, params);
  }

  execute(parts: QueryPart[]): Promise<void> {
    return transaction2(this.pool, this.toRunnable(parts));
  }

  transaction(...runnables: Runnable[]): Promise<void> {
    return transaction2(this.pool, async (client: PoolClient) => {
      for (let i = 0; i < runnables.length; i++) {
        await runnables[i](client);
      }
    });
  }
}
