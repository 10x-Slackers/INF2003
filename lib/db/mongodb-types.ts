export type NumberRange = {
  min?: number | null;
  max?: number | null;
};

export type SearchFilters = {
  town_id?: string[];
  flat_model_id?: string[];
  flat_type_id?: string[];
  price?: NumberRange;
  floor_area_sqm?: NumberRange;
  storey?: NumberRange;
  lease_remaining?: NumberRange;
  transaction_year?: {
    from?: number | null;
    to?: number | null;
  };
};

export type SavedAlert = {
  _id: string;
  user_id: string;
  filters: SearchFilters;
  is_active: boolean;
  created_at: number;
  updated_at: number;
  last_triggered_at?: number;
};

export type SearchLog = {
  _id: string;
  user_id: string;
  query: SearchFilters;
  searched_at: number;
};
