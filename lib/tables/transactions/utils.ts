export function addCondition<T>(
  conditions: string[],
  params: unknown[],
  field: T | undefined,
  column: string,
  operator: string = "=",
) {
  if (field !== undefined) {
    conditions.push(`${column} ${operator} ?`);
    params.push(field);
  }
}
