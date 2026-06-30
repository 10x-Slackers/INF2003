class MockCollection<T = unknown> {
  docs: T[] = [];
  findOneResult: T | null = null;
  findOneAndUpdateResult: T | null = null;
  updateOneResult = { matchedCount: 1 };
  deleteOneResult = { deletedCount: 1 };
  findQuery?: unknown;
  sortValue?: unknown;
  skipValue?: number;
  limitValue?: number;
  findOneQuery?: unknown;
  insertDoc?: T;
  updateOneArgs?: unknown[];
  findOneAndUpdateArgs?: unknown[];
  deleteOneQuery?: unknown;
  private error?: unknown;

  reset() {
    this.docs = [];
    this.findOneResult = null;
    this.findOneAndUpdateResult = null;
    this.updateOneResult = { matchedCount: 1 };
    this.deleteOneResult = { deletedCount: 1 };
    this.findQuery = undefined;
    this.sortValue = undefined;
    this.skipValue = undefined;
    this.limitValue = undefined;
    this.findOneQuery = undefined;
    this.insertDoc = undefined;
    this.updateOneArgs = undefined;
    this.findOneAndUpdateArgs = undefined;
    this.deleteOneQuery = undefined;
    this.error = undefined;
  }

  fail(error: unknown) {
    this.error = error;
  }

  find(query: unknown) {
    this.throwIfFailed();
    this.findQuery = query;
    return this;
  }

  sort(value: unknown) {
    this.throwIfFailed();
    this.sortValue = value;
    return this;
  }

  skip(value: number) {
    this.throwIfFailed();
    this.skipValue = value;
    return this;
  }

  limit(value: number) {
    this.throwIfFailed();
    this.limitValue = value;
    return this;
  }

  async toArray() {
    this.throwIfFailed();
    return this.docs;
  }

  async findOne(query: unknown) {
    this.throwIfFailed();
    this.findOneQuery = query;
    return this.findOneResult;
  }

  async insertOne(document: T) {
    this.throwIfFailed();
    this.insertDoc = document;
    return { insertedId: (document as { _id?: unknown })._id };
  }

  async updateOne(...args: unknown[]) {
    this.throwIfFailed();
    this.updateOneArgs = args;
    return this.updateOneResult;
  }

  async findOneAndUpdate(...args: unknown[]) {
    this.throwIfFailed();
    this.findOneAndUpdateArgs = args;
    return this.findOneAndUpdateResult;
  }

  async deleteOne(query: unknown) {
    this.throwIfFailed();
    this.deleteOneQuery = query;
    return this.deleteOneResult;
  }

  private throwIfFailed() {
    if (this.error) {
      throw this.error;
    }
  }
}

const collections = new Map<string, MockCollection>();
const queryResults: unknown[][] = [];
const executeResults: { affectedRows: number; insertId: number }[] = [];
const queryCalls: { sql: string; params: unknown[] }[] = [];
const executeCalls: { sql: string; params: unknown[] }[] = [];
let sqlError: unknown;

export function collection<T = unknown>(name: string): MockCollection<T> {
  if (!collections.has(name)) {
    collections.set(name, new MockCollection());
  }
  return collections.get(name) as MockCollection<T>;
}

export function resetCollections() {
  collections.forEach((value) => value.reset());
}

export function resetSql() {
  queryResults.length = 0;
  executeResults.length = 0;
  queryCalls.length = 0;
  executeCalls.length = 0;
  sqlError = undefined;
}

export function mockQueryResults(...results: unknown[][]) {
  queryResults.push(...results);
}

export function mockExecuteResults(
  ...results: { affectedRows: number; insertId?: number }[]
) {
  executeResults.push(
    ...results.map((result) => ({
      affectedRows: result.affectedRows,
      insertId: result.insertId ?? 0,
    })),
  );
}

export function failSql(error: unknown) {
  sqlError = error;
}

export function sqlQueries() {
  return queryCalls;
}

export function sqlExecutes() {
  return executeCalls;
}

export async function query<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (sqlError) throw sqlError;
  queryCalls.push({ sql, params });
  return (queryResults.shift() ?? []) as T[];
}

export async function execute(sql: string, params: unknown[] = []) {
  if (sqlError) throw sqlError;
  executeCalls.push({ sql, params });
  return executeResults.shift() ?? { affectedRows: 1, insertId: 0 };
}

export const db = {
  collection,
};
