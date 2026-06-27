type DbError = { code?: string };

function hasCode(err: unknown, code: string): boolean {
  return (err as DbError)?.code === code;
}

// A UNIQUE constraint was violated (e.g. duplicate insert).
export function isDuplicateKeyError(err: unknown): boolean {
  return hasCode(err, "ER_DUP_ENTRY");
}

// An INSERT/UPDATE referenced a parent row that does not exist.
export function isMissingReferenceError(err: unknown): boolean {
  return hasCode(err, "ER_NO_REFERENCED_ROW_2");
}

// A DELETE/UPDATE was blocked because other rows still reference this one.
export function isReferencedByOthersError(err: unknown): boolean {
  return hasCode(err, "ER_ROW_IS_REFERENCED_2");
}
