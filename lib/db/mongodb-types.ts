export type NumberRange = {
  min?: number | null;
  max?: number | null;
};

export type SavedAlertFilters = {
  town_id?: string[];
  flat_model_id?: string[];
  flat_type_id?: string[];
  price?: NumberRange;
  floor_area_sqm?: NumberRange;
  storey?: NumberRange;
  lease_remaining?: NumberRange;
};

export type SearchLogQuery = SavedAlertFilters & {
  transaction_year?: {
    from?: number | null;
    to?: number | null;
  };
};

export type SavedAlert = {
  _id: string;
  user_id: string;
  filters: SavedAlertFilters;
  is_active: boolean;
  created_at: number;
  updated_at: number;
  last_triggered_at?: number;
};

export type SearchLog = {
  _id: string;
  user_id: string;
  query: SearchLogQuery;
  searched_at: number;
};

export type TownProfileSummary = {
  total_transaction: number;
  earliest_transaction: string;
  latest_transaction: string;
  avg_resale_price_by_flat_type: Record<string, number>;
};

export type TownProfile = {
  _id: string;
  transaction_summary: TownProfileSummary;
  coordinates: number[][][];
  updated_at: number;
};
