export {
  pool,
  query,
  execute,
  queryOne,
  executeReturning,
  isEmptyUpdate,
  buildUpdateFields,
  addCondition,
  addInCondition,
  deleteById,
  paginatedQuery,
  type QueryResult,
} from "./mariadb";

export { client, db, findById, deleteDocById, createWithUuid } from "./mongodb";
