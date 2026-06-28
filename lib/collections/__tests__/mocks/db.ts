type Cursor = {
  sort: (value: unknown) => Cursor;
  skip: (value: number) => Cursor;
  limit: (value: number) => Cursor;
  toArray: () => Promise<unknown[]>;
};

export class MockCollection {
  docs: unknown[] = [];
  findQuery?: unknown;
  findOneQuery?: unknown;
  findOneResult?: unknown;
  insertDoc?: unknown;
  findOneAndUpdateArgs?: unknown[];
  findOneAndUpdateResult?: unknown;
  updateOneArgs?: unknown[];
  updateOneResult = { matchedCount: 1 };
  deleteOneQuery?: unknown;
  deleteOneResult = { deletedCount: 1 };
  sortValue?: unknown;
  skipValue?: number;
  limitValue?: number;
  error?: Error;

  reset() {
    this.docs = [];
    this.findQuery = undefined;
    this.findOneQuery = undefined;
    this.findOneResult = undefined;
    this.insertDoc = undefined;
    this.findOneAndUpdateArgs = undefined;
    this.findOneAndUpdateResult = undefined;
    this.updateOneArgs = undefined;
    this.updateOneResult = { matchedCount: 1 };
    this.deleteOneQuery = undefined;
    this.deleteOneResult = { deletedCount: 1 };
    this.sortValue = undefined;
    this.skipValue = undefined;
    this.limitValue = undefined;
    this.error = undefined;
  }

  fail(error = new Error("Mock database error")) {
    this.error = error;
  }

  find(query: unknown): Cursor {
    if (this.error) {
      throw this.error;
    }
    this.findQuery = query;
    const cursor: Cursor = {
      sort: (value) => {
        this.sortValue = value;
        return cursor;
      },
      skip: (value) => {
        this.skipValue = value;
        return cursor;
      },
      limit: (value) => {
        this.limitValue = value;
        return cursor;
      },
      toArray: async () => this.docs,
    };
    return cursor;
  }

  async findOne(query: unknown) {
    if (this.error) {
      throw this.error;
    }
    this.findOneQuery = query;
    return this.findOneResult ?? null;
  }

  async insertOne(document: unknown) {
    if (this.error) {
      throw this.error;
    }
    this.insertDoc = document;
    this.docs.push(document);
    return { insertedId: (document as { _id?: string })._id };
  }

  async findOneAndUpdate(...args: unknown[]) {
    if (this.error) {
      throw this.error;
    }
    this.findOneAndUpdateArgs = args;
    return this.findOneAndUpdateResult ?? null;
  }

  async updateOne(...args: unknown[]) {
    if (this.error) {
      throw this.error;
    }
    this.updateOneArgs = args;
    return this.updateOneResult;
  }

  async deleteOne(query: unknown) {
    if (this.error) {
      throw this.error;
    }
    this.deleteOneQuery = query;
    return this.deleteOneResult;
  }
}

const collections = new Map<string, MockCollection>();

export const db = {
  collection: (name: string) => {
    if (!collections.has(name)) {
      collections.set(name, new MockCollection());
    }
    return collections.get(name);
  },
};

export const client = {};

export function collection(name: string) {
  const value = collections.get(name);
  if (!value) {
    throw new Error(`Missing collection mock: ${name}`);
  }
  return value;
}

export function resetCollections() {
  collections.forEach((value) => value.reset());
}
