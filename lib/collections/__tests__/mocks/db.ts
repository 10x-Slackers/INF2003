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

export function collection<T = unknown>(name: string): MockCollection<T> {
  if (!collections.has(name)) {
    collections.set(name, new MockCollection());
  }
  return collections.get(name) as MockCollection<T>;
}

export function resetCollections() {
  collections.forEach((value) => value.reset());
}

export const db = {
  collection,
};
