import { Pool, QueryResult, PoolClient } from 'pg';
import { Runnable, runnable, transaction2, Runnable2, emptyResult, resultOf } from './util';
import { Logger } from 'log4js';
import { Field, FieldLike, Order, SortField, Table, QueryPart, SelectFinalPart,
  Condition, SelectPart, FromPart, UpdatePart, AssignFieldPart, UpdateWherePart,
  SelectWherePart, Mapper, JoinPart, JoinConditionPart, OrderPart, GroupByPart,
  InsertIntoPart1, InsertIntoPart2, InsertIntoPart3, InsertIntoPart4, InsertIntoPart5,
  InsertIntoPart6, InsertIntoPart7, InsertIntoPart8, InsertIntoPart9, InsertIntoPart10,
  InsertValuesPart, Result, InsertFinalPart, Create, Record, DeleteWherePart, DeleteFinalPart } from './model';

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

  like(value: T): Condition {
    return this.condition('LIKE', value);
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

  execute(): Promise<Result<void>> {
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

  execute(): Promise<Result<void>> {
    return this.create.execute(this.parts);
  }

  render(params: any[]) {
    return 'ON ' + this.cond.render(params);
  }
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

  execute(): Promise<Result<void>> {
    return this.create.execute(this.parts);
  }

  render(params: any[]) {
    return 'WHERE ' + this.cond.render(params);
  }
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

class InsertValuesPartImpl implements InsertValuesPart {
  constructor(
    private readonly create: CreateImpl,
    private readonly table: Table,
    private readonly fields: Field<any>[],
    private readonly values: any[],
  ) {}

  execute() {
    return this.create.executeInsert(this.table, this.fields, this.values) as Promise<Result<void>>;
  }

  runnable() {
    return this.create.insert(this.table, this.fields, this.values);
  }

  returning<T>(field: Field<T>) {
    return new InsertFinalPartImpl<T>(this.create, this.table, this.fields, this.values, field);
  }
}

interface DeleteFromPart extends DeleteFinalPart {
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

  toRunnable(): Runnable {
    return this.create.toRunnable(this.parts);
  }

  execute(): Promise<Result<void>> {
    return this.create.execute(this.parts);
  }
}

class InsertFinalPartImpl<T> implements InsertFinalPart<T> {
  constructor(
    private readonly create: CreateImpl,
    private readonly table: Table,
    private readonly fields: Field<any>[],
    private readonly values: any[],
    private readonly returning: Field<T>,
  ) {}

  execute() {
    return this.create.executeInsert(this.table, this.fields, this.values, this.returning);
  }

  runnable() {
    return this.create.insert(this.table, this.fields, this.values, this.returning);
  }
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

  renderInsert(table: Table, fields: Field<any>[], values: any[], returning?: Field<any>): [string, any[]] {
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
    return [query, params];
  }

  insert<T>(table: Table, fields: Field<any>[], values: any[], returning?: Field<T>): Runnable2<T> {
    const [query, params] = this.renderInsert(table, fields, values);
    return runnable(query, params, returning);
  }

  executeInsert<T>(table: Table, fields: Field<any>[], values: any[], returning?: Field<T>): Promise<Result<T>> {
    const [query, params] = this.renderInsert(table, fields, values, returning);
    return this.executeInTransaction(query, params, returning);
  }

  executeInTransaction<T = void>(query: string, params: any[], returning?: Field<T>): Promise<Result<T>> {
    return transaction2(this.pool, runnable(query, params, returning), returning);
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

  renderQuery(parts: QueryPart[]): [string, any[]] {
    const params: any[] = [];
    const query = parts.map(part => part.render(params)).join(' ');
    if (this.canLog) {
      this.log(query);
      this.log(formatParamsForLog(params));
    }
    return [query, params];
  }

  toRunnable(parts: QueryPart[]): Runnable {
    const [query, params] = this.renderQuery(parts);
    return runnable(query, params);
  }

  execute(parts: QueryPart[]): Promise<Result<void>> {
    const [query, params] = this.renderQuery(parts);
    return this.executeInTransaction(query, params);
  }

  transaction(...runnables: Runnable[]): Promise<Result<void>> {
    return transaction2(this.pool, async (client: PoolClient) => {
      for (let i = 0; i < runnables.length; i++) {
        await runnables[i](client);
      }
      return emptyResult();
    });
  }
}
