export type Role = "ADMIN" | "AGENT" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export type PublicUser = Omit<User, "password_hash">;

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: Role;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
