import { handleDbError, type DbError } from "@/lib/utils";

export type CollectionResult<T> = T | DbError;

export const handleCollectionError = handleDbError;
