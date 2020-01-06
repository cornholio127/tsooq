import { QueryPart } from '../model';

export const isSubquery = (x: unknown) =>
  typeof x === 'object' && 'render' in x;

export const isFieldLike = (x: unknown) =>
  typeof x === 'object' && 'name' in x && 'alias' in x;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderSubquery: (subQuery: any, params: unknown[]) => string = (
  subQuery,
  params
) => {
  const parts: QueryPart[] = subQuery.parts;
  return parts.map(p => p.render(params)).join(' ');
};
