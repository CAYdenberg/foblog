import { z } from "../deps.ts";
import { QueryString } from "../deps.ts";

const { parse, stringify } = QueryString;

export const parseQuery = <Q>(schema: z.Schema<Q>) => (query: string) => {
  const params = parse(query, { arrayFormat: "comma" });
  const result = schema.parse(params);
  return result;
};

export const stringifyQuery = <Q>(query: QueryString.ParsedQuery<Q>) => {
  return stringify(query, { arrayFormat: "comma" });
};
