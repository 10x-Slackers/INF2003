export { pool, query, execute, type QueryResult } from "./mariadb";

export { client, db } from "./mongodb";

export {
  isDuplicateKeyError,
  isMissingReferenceError,
  isReferencedByOthersError,
} from "./errors";
