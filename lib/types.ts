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

export type Region =
  | "NORTH"
  | "NORTH-EAST"
  | "EAST"
  | "WEST"
  | "CENTRAL";

export interface Town {
  id: string;
  region: Region;
  name: string;
}

export interface CreateTownPayload {
  region: Region;
  name: string;
}

export interface UpdateTownPayload {
  region?: Region;
  name?: string;
}

export interface Property {
  id: string;
  town_id: string;
  block: string;
  street_name: string;
  lease_commence_year: number;
}

export interface Amenity {
  id: string;
  town_id: string;
  amenity_type_id: number;
  name: string;
  street_name: string | null;
  postal_code: string | null;
  longitude: number | null;
  latitude: number | null;
}
