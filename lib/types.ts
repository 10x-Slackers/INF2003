import type { UserRole } from "@/lib/auth";

export type User = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type PublicUser = Omit<User, "password_hash">;

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  role?: UserRole;
};

export type FlatType = {
  id: number;
  name: string;
};

export type FlatModel = {
  id: number;
  name: string;
};

export type StoreyRange = {
  id: number;
  min_storey: number;
  max_storey: number;
};

export type AmenityType = {
  id: number;
  name: string;
};

export type Region =
  | "NORTH REGION"
  | "NORTH-EAST REGION"
  | "EAST REGION"
  | "WEST REGION"
  | "CENTRAL REGION";

export type Town = {
  id: string;
  region: Region;
  name: string;
};

export type CreateTownPayload = {
  region: Region;
  name: string;
};

export type UpdateTownPayload = {
  region?: Region;
  name?: string;
};

export type Property = {
  id: string;
  town_id: string;
  block: string;
  street_name: string;
  lease_commence_year: number;
};

export type Amenity = {
  id: string;
  town_id: string;
  amenity_type_id: number;
  name: string;
  street_name: string | null;
  postal_code: string | null;
  longitude: number | null;
  latitude: number | null;
};

export type CreateAmenityPayload = {
  town_id: string;
  amenity_type_id: number;
  name: string;
  street_name?: string;
  postal_code?: string;
  longitude?: number;
  latitude?: number;
};

export type UpdateAmenityPayload = {
  town_id?: string;
  amenity_type_id?: number;
  name?: string;
  street_name?: string;
  postal_code?: string;
  longitude?: number;
  latitude?: number;
};

export type CreatePropertyPayload = {
  town_id: string;
  block: string;
  street_name: string;
  lease_commence_year: number;
};

export type LatestTransactionSummary = {
  id: string;
  flat_type_id: number;
  flat_type: string;
  resale_price: number;
  transaction_month: string;
};

export type PropertyWithLatestTransaction = Property & {
  latest_transaction: LatestTransactionSummary | null;
};

export type PropertyDetail = Property & {
  town: Town | null;
  amenities: Amenity[];
};

export type ResaleTransaction = {
  id: string;
  uploaded_by_user_id: string | null;
  property_id: string;
  flat_type_id: number;
  flat_model_id: number;
  storey_range_id: number;
  floor_area_sqm: number;
  transaction_month: string;
  resale_price: number;
};

export type CreateTransactionPayload = {
  flat_type_id: number;
  flat_model_id: number;
  storey_range_id: number;
  floor_area_sqm: number;
  transaction_month: string;
  resale_price: number;
} & ({ property_id: string } | { property: CreatePropertyPayload });

export type UpdateTransactionPayload = {
  flat_type_id?: number;
  flat_model_id?: number;
  storey_range_id?: number;
  floor_area_sqm?: number;
  transaction_month?: string;
  resale_price?: number;
};

export type SavedProperty = {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
};

export type SavedPropertyDetail = SavedProperty & {
  property: PropertyWithLatestTransaction | null;
};
